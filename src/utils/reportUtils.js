import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
        
        // Usar autoTable para melhor formatação
        doc.autoTable({
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
