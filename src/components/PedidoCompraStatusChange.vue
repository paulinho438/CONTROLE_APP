<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="modalTitle"
    :modal="true"
    :style="{ width: '500px' }"
  >
    <div class="flex flex-column gap-3">
      <!-- Status Atual -->
      <div>
        <label class="block text-600 text-sm font-medium mb-2">Status Atual</label>
        <div class="flex align-items-center gap-2">
          <Tag :value="getLabelStatus(pedido.status)" :severity="getCorStatus(pedido.status)" />
          <Tag v-if="isOldStatus" value="Status Antigo" severity="warning" />
        </div>
        <small v-if="isOldStatus" class="text-500 block mt-1">
          Este pedido está com um status antigo. Selecione o status equivalente no novo fluxo.
        </small>
      </div>

      <!-- Novo Status -->
      <div>
        <label class="block text-600 text-sm font-medium mb-2">Novo Status</label>
        <Dropdown
          v-model="selectedStatus"
          :options="validStatuses"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecione o novo status"
          class="w-full"
          :disabled="loading"
        />
      </div>

      <!-- Justificativa (apenas para link_reprovado) -->
      <div v-if="selectedStatus === 'link_reprovado'">
        <label class="block text-600 text-sm font-medium mb-2">
          Justificativa do Reprovamento <span class="text-red-500">*</span>
        </label>
        <Textarea
          v-model="justification"
          :rows="4"
          placeholder="Informe o motivo da reprovação do LINK..."
          class="w-full"
          :disabled="loading"
          :class="{ 'p-invalid': showJustificationError }"
        />
        <small v-if="showJustificationError" class="p-error">Justificativa é obrigatória.</small>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        class="p-button-text"
        @click="$emit('update:visible', false)"
        :disabled="loading"
      />
      <Button
        :label="confirmButtonLabel"
        :icon="confirmButtonIcon"
        :class="confirmButtonClass"
        @click="confirmar"
        :loading="loading"
        :disabled="!canConfirm"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import PurchaseOrderService from '@/service/PurchaseOrderService';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

export default {
  name: 'PedidoCompraStatusChange',
  components: {
    Dialog,
    Tag,
    Dropdown,
    Textarea,
    Button,
  },
  props: {
    pedido: {
      type: Object,
      required: true,
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:visible', 'status-updated'],
  setup(props, { emit }) {
    const toast = useToast();
    const service = new PurchaseOrderService();

    // Usar computed para sincronizar visible com dialogVisible
    const dialogVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value),
    });

    const selectedStatus = ref(null);
    const justification = ref('');
    const loading = ref(false);
    const showJustificationError = ref(false);

    // Status válidos para transição
    const validStatuses = computed(() => {
      const transitions = {
        pendente: [{ label: 'Aguardando LINK', value: 'link' }],
        link: [
          { label: 'LINK Aprovado', value: 'link_aprovado' },
          { label: 'LINK Reprovado', value: 'link_reprovado' },
        ],
        link_aprovado: [{ label: 'Coleta', value: 'coleta' }],
        coleta: [{ label: 'Em Trânsito', value: 'em_transito' }],
        em_transito: [
          { label: 'Atendido', value: 'atendido' },
          { label: 'Atendido Parcial', value: 'atendido_parcial' },
        ],
        atendido: [{ label: 'Pagamento', value: 'pagamento' }],
        atendido_parcial: [{ label: 'Pagamento', value: 'pagamento' }],
        pagamento: [{ label: 'Encerrado', value: 'encerrado' }],
        // Status antigos - permitir migração
        recebido: [
          { label: 'Atendido', value: 'atendido' },
          { label: 'Pagamento', value: 'pagamento' },
          { label: 'Encerrado', value: 'encerrado' },
        ],
        parcial: [
          { label: 'Atendido Parcial', value: 'atendido_parcial' },
          { label: 'Atendido', value: 'atendido' },
          { label: 'Pagamento', value: 'pagamento' },
        ],
        parcialmente_recebido: [
          { label: 'Atendido Parcial', value: 'atendido_parcial' },
          { label: 'Atendido', value: 'atendido' },
          { label: 'Pagamento', value: 'pagamento' },
        ],
      };

      const currentStatus = props.pedido?.status;
      return transitions[currentStatus] || [];
    });

    // Verificar se é status antigo (migração)
    const isOldStatus = computed(() => {
      const oldStatuses = ['recebido', 'parcial', 'parcialmente_recebido'];
      return oldStatuses.includes(props.pedido?.status);
    });

    // Título do modal
    const modalTitle = computed(() => {
      if (props.pedido?.status === 'pendente') {
        return `Encaminhar para PROTHEUS - ${props.pedido?.order_number || ''}`;
      }
      if (isOldStatus.value) {
        return `Migrar Status (Antigo → Novo) - ${props.pedido?.order_number || ''}`;
      }
      return `Alterar Status do Pedido - ${props.pedido?.order_number || ''}`;
    });

    // Label do botão de confirmação
    const confirmButtonLabel = computed(() => {
      if (props.pedido?.status === 'pendente') {
        return 'Encaminhar para PROTHEUS';
      }
      return 'Confirmar Alteração';
    });

    // Ícone do botão de confirmação
    const confirmButtonIcon = computed(() => {
      if (props.pedido?.status === 'pendente') {
        return 'pi pi-send';
      }
      return 'pi pi-check';
    });

    // Classe do botão de confirmação
    const confirmButtonClass = computed(() => {
      if (props.pedido?.status === 'pendente') {
        return 'p-button-warning';
      }
      return 'p-button-primary';
    });

    // Pode confirmar?
    const canConfirm = computed(() => {
      if (!selectedStatus.value) return false;
      if (selectedStatus.value === 'link_reprovado' && !justification.value.trim()) {
        return false;
      }
      return true;
    });

    // Pré-selecionar status quando pendente
    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          if (props.pedido?.status === 'pendente') {
            selectedStatus.value = 'link'; // Pré-selecionar "link" quando status é pendente
          } else {
            selectedStatus.value = null;
          }
          justification.value = '';
          showJustificationError.value = false;
        }
      }
    );

    // Validar justificativa em tempo real
    watch(selectedStatus, () => {
      if (selectedStatus.value !== 'link_reprovado') {
        justification.value = '';
        showJustificationError.value = false;
      }
    });

    const getLabelStatus = (status) => {
      const statusMap = {
        pendente: 'Pendente',
        link: 'Aguardando LINK',
        link_aprovado: 'LINK Aprovado',
        link_reprovado: 'LINK Reprovado',
        coleta: 'Coleta',
        em_transito: 'Em Trânsito',
        atendido: 'Atendido',
        atendido_parcial: 'Atendido Parcial',
        pagamento: 'Pagamento',
        encerrado: 'Encerrado',
      };
      return statusMap[status] || status || '-';
    };

    const getCorStatus = (status) => {
      const corMap = {
        pendente: 'warning',
        link: 'warning',
        link_aprovado: 'success',
        link_reprovado: 'danger',
        coleta: 'info',
        em_transito: 'info',
        atendido: 'success',
        atendido_parcial: 'warning',
        pagamento: 'info',
        encerrado: 'success',
      };
      return corMap[status] || 'secondary';
    };

    const confirmar = async () => {
      // Validar justificativa
      if (selectedStatus.value === 'link_reprovado' && !justification.value.trim()) {
        showJustificationError.value = true;
        toast.add({
          severity: 'error',
          summary: 'Validação',
          detail: 'Justificativa é obrigatória quando o LINK é reprovado.',
          life: 3000,
        });
        return;
      }

      try {
        loading.value = true;
        showJustificationError.value = false;

        await service.updateStatus(props.pedido.id, selectedStatus.value, justification.value || null);

        emit('status-updated');
        emit('update:visible', false);
      } catch (error) {
        const detail = error?.response?.data?.message || 'Erro ao atualizar status do pedido.';
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail,
          life: 4000,
        });
      } finally {
        loading.value = false;
      }
    };

      return {
        dialogVisible,
        selectedStatus,
        justification,
        loading,
        showJustificationError,
        validStatuses,
        isOldStatus,
        modalTitle,
        confirmButtonLabel,
        confirmButtonIcon,
        confirmButtonClass,
        canConfirm,
        getLabelStatus,
        getCorStatus,
        confirmar,
      };
  },
};
</script>

