import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const gerarPDF = (titulo, dados, colunas, nomeArquivo = 'relatorio.pdf') => {
    try {
        // Validar se há dados
        if (!dados || dados.length === 0) {
            throw new Error('Não há dados para gerar o relatório');
        }

        // Validar se há colunas
        if (!colunas || colunas.length === 0) {
            throw new Error('Não há colunas definidas para o relatório');
        }

        const doc = new jsPDF();
        
        // Cabeçalho
        doc.setFontSize(16);
        doc.text(titulo, 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 105, 22, { align: 'center' });
        
        // Preparar dados para a tabela
        const headers = colunas.map(col => col.header);
        const rows = dados.map(item => 
            colunas.map(col => {
                const valor = col.formatter ? col.formatter(item[col.field], item) : (item[col.field] || '');
                return String(valor);
            })
        );
        
        // Usar autoTable como função (forma correta para versão 5.x)
        autoTable(doc, {
            startY: 30,
            head: [headers],
            body: rows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 30 }
        });
        
        doc.save(nomeArquivo);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        throw error;
    }
};

export const gerarPDFRomaneio = (romaneio, nomeArquivo = 'romaneio.pdf') => {
    try {
        if (!romaneio || !romaneio.cabecalho) {
            throw new Error('Não há dados do romaneio para gerar o PDF');
        }

        const doc = new jsPDF();
        const cab = romaneio.cabecalho;
        const formatarData = (data) => !data ? '' : new Date(data).toLocaleDateString('pt-BR');

        let y = 15;

        doc.setFontSize(16);
        doc.text(`ROMANEIO N° ${cab.numero_romaneio || ''}`, 105, y, { align: 'center' });
        y += 12;

        doc.setFontSize(10);
        doc.text(`Data da saída: ${formatarData(cab.data_saida)}`, 14, y);
        doc.text(`Pátio: ${cab.patio || '-'}`, 105, y);
        y += 7;
        doc.text(`Destino: ${cab.destino || '-'}`, 14, y);
        doc.text(`Tipo: ${cab.tipo_movimentacao || '-'}`, 105, y);
        y += 14;

        doc.setFontSize(11);
        doc.text('Materiais e Quantidades', 14, y);
        y += 6;

        const headersMateriais = ['Material', 'Quantidade', 'Unidade'];
        const rowsMateriais = (romaneio.materiais || []).map(m => [
            m.material || '-',
            String(m.quantidade ?? ''),
            m.unidade_medida || '-'
        ]);

        autoTable(doc, {
            startY: y,
            head: [headersMateriais],
            body: rowsMateriais.length ? rowsMateriais : [['Nenhum item', '', '']],
            styles: { fontSize: 9 },
            headStyles: { fillColor: [66, 139, 202] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable.finalY + 16;

        doc.setFontSize(11);
        doc.text('Assinaturas', 14, y);
        y += 10;

        doc.setFontSize(9);
        doc.text('Responsável', 14, y);
        doc.text(cab.responsavel || '-', 14, y + 6);
        doc.line(14, y + 12, 90, y + 12);

        doc.text('Solicitante', 110, y);
        doc.text(cab.grupo || '-', 110, y + 6);
        doc.line(110, y + 12, 186, y + 12);

        doc.save(nomeArquivo);
    } catch (error) {
        console.error('Erro ao gerar PDF do romaneio:', error);
        throw error;
    }
};

export const exportarExcel = (dados, nomeArquivo = 'relatorio.xlsx', nomeAba = 'Dados') => {
    try {
        // Validar se há dados
        if (!dados || dados.length === 0) {
            throw new Error('Não há dados para exportar');
        }

        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, nomeAba);
        
        // Ajustar largura das colunas
        if (dados.length > 0 && dados[0]) {
            const colWidths = Object.keys(dados[0]).map(key => ({
                wch: Math.max(key.length, ...dados.map(row => String(row[key] || '').length))
            }));
            ws['!cols'] = colWidths;
        }
        
        XLSX.writeFile(wb, nomeArquivo);
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        throw error;
    }
};
