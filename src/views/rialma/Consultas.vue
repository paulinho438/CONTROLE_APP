<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const navegar = (rota) => {
    router.push(rota);
};
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="m-0">CONSULTAS</h2>
                <small>Ferramental e pátio</small>
            </div>
        </div>

        <div class="grid">
            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/balanco')">
                    <template #title>Balanço</template>
                    <template #content>
                        <p>Consultar balanço de materiais</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/entradas')">
                    <template #title>Entrada de Material</template>
                    <template #content>
                        <p>Consultar entradas de material</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/saidas')">
                    <template #title>Saída de Material</template>
                    <template #content>
                        <p>Consultar saídas de material</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/historico-notas-fiscais')">
                    <template #title>Histórico de Notas Fiscais</template>
                    <template #content>
                        <p>Consultar histórico de notas fiscais</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/grupos')">
                    <template #title>Grupo</template>
                    <template #content>
                        <p>Consultar grupos de materiais</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/materiais')">
                    <template #title>Material</template>
                    <template #content>
                        <p>Consultar materiais cadastrados</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/patios')">
                    <template #title>Pátio</template>
                    <template #content>
                        <p>Consultar pátios cadastrados</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/fornecedores')">
                    <template #title>Fornecedor</template>
                    <template #content>
                        <p>Consultar fornecedores cadastrados</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/colaboradores')">
                    <template #title>Colaborador</template>
                    <template #content>
                        <p>Consultar colaboradores cadastrados</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/saida-transferencia')">
                    <template #title>Saída e Transferência</template>
                    <template #content>
                        <p>Consultar saídas e transferências</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/progresso-recebimento')">
                    <template #title>Progresso de Recebimento</template>
                    <template #content>
                        <p>Consultar progresso de recebimento</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/previsao-geral')">
                    <template #title>Previsão Geral</template>
                    <template #content>
                        <p>Consultar previsão geral</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
                <Card class="cursor-pointer hover:shadow-4 transition-all" @click="navegar('/previsao-por-patio')">
                    <template #title>Previsão por Pátio</template>
                    <template #content>
                        <p>Consultar previsão por pátio</p>
                        <Button label="Acessar" icon="pi pi-arrow-right" class="mt-2" />
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}
</style>

