// ==============================
// 1. Seleção de Elementos do DOM
// ==============================

const addButton = document.getElementById('addButton');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const recordForm = document.getElementById('recordForm');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const monthFilter = document.getElementById('monthFilter');
const codeFilter = document.getElementById('codeFilter');
const modalTitle = document.getElementById('modalTitle');
const csvInput = document.getElementById('csvInput');
const resetButton = document.getElementById('resetButton'); // Botão de Reset
const forceLoadButton = document.getElementById('forceLoadButton'); // Botão de Forçar Carregamento
const codigoSelect = document.getElementById('codigo'); // Seleção de Código
const dataFimInput = document.getElementById('dataFim'); // Input de Data Fim
const message = document.getElementById('message'); // Mensagem de Verificação

const totalRecords = document.getElementById('totalRecords');
const uniqueEmployees = document.getElementById('uniqueEmployees');
const activeMonths = document.getElementById('activeMonths');

let data = []; // Array para armazenar os registros

// Gráficos
let codeChart;
let monthChart;

// Estado para Edição
let isEditing = false;
let editingIndex = null;

// Selecionar os botões de exportação
const exportPdfButton = document.getElementById('exportPdfButton');
const exportExcelButton = document.getElementById('exportExcelButton');

// ==============================
// 2. Funções Auxiliares
// ==============================

/**
 * Formata uma data no formato YYYY-MM-DD para DD/MM/AAAA
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada em DD/MM/AAAA
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr; // Se já estiver no formato desejado
    const day = String(date.getDate()).padStart(2, '0');
    const month = String((date.getMonth() + 1)).padStart(2, '0'); // Meses começam em 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Obtém o mês e ano a partir de uma data no formato YYYY-MM-DD
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 * @returns {string} Mês e ano no formato MM/AA
 */
function getMonthFromDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param {string} startDateStr - Data de início no formato YYYY-MM-DD
 * @param {string} endDateStr - Data de fim no formato YYYY-MM-DD
 * @returns {number|null} Diferença em dias ou null se inválido
 */
function calculateDays(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate) || isNaN(endDate)) {
        return null; // Retorna null se alguma das datas for inválida
    }

    // Calcular a diferença em milissegundos
    const diffTime = endDate - startDate;
    if (diffTime < 0) {
        return null; // Retorna null se a Data Fim for anterior à Data Início
    }

    // Converter a diferença para dias
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Verifica se dois períodos de férias se sobrepõem
 * @param {string} startA - Data de início do primeiro período (YYYY-MM-DD)
 * @param {string} endA - Data de fim do primeiro período (YYYY-MM-DD)
 * @param {string} startB - Data de início do segundo período (YYYY-MM-DD)
 * @param {string} endB - Data de fim do segundo período (YYYY-MM-DD)
 * @returns {boolean} True se houver sobreposição, caso contrário false
 */
function periodsOverlap(startA, endA, startB, endB) {
    return (new Date(startA) <= new Date(endB)) && (new Date(endA) >= new Date(startB));
}

/**
 * Gera um ID único para cada registro
 * @returns {string} ID único
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ==============================
// 3. Funções de Manipulação de Dados
// ==============================

/**
 * Salva os dados no localStorage
 */
function saveData() {
    localStorage.setItem('dashboardData', JSON.stringify(data));
}

/**
 * Carrega os dados do localStorage ou do CSV
 */
function loadData() {
    const storedData = localStorage.getItem('dashboardData');
    if (storedData) {
        data = JSON.parse(storedData);
        console.log('Dados Carregados do localStorage:', data);
        renderTable();
        showMessage('Dados carregados do armazenamento local.', 'success');
    } else {
        // Carregar dados do CSV automaticamente
        loadCSVAutomatically();
    }
}

/**
 * Inicializa os dados a partir de um arquivo CSV
 * @param {File} file - Arquivo CSV selecionado pelo usuário
 */
function initializeDataFromCSV(file) {
    showMessage('Carregando dados...', 'info');
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('CSV Parsing Complete:', results);
            data = results.data.map(item => ({
                id: generateUniqueId(),
                funcionario: item.Funcionário.trim(),
                dataInicio: item["Data Início"] ? item["Data Início"].trim() : '',
                dataFim: item["Data Fim"] ? item["Data Fim"].trim() : '',
                codigo: item.Código ? item.Código.trim().toUpperCase() : ''
            })).filter(item => item.funcionario && item.dataInicio && item.codigo); // Filtrar registros válidos
            console.log('Dados Processados:', data);
            saveData();
            renderTable();
            showMessage('Dados carregados com sucesso!', 'success');
        },
        error: function(error) {
            console.error('Erro ao carregar o CSV:', error);
            showMessage('Erro ao carregar o CSV: ' + error.message, 'error');
        }
    });
}

/**
 * Carrega o CSV automaticamente via fetch
 */
function loadCSVAutomatically() {
    showMessage('Carregando dados do CSV...', 'info');
    fetch('data.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao carregar o arquivo CSV');
            }
            return response.text();
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('CSV Parsing Complete:', results);
                    data = results.data.map(item => ({
                        id: generateUniqueId(),
                        funcionario: item.Funcionário.trim(),
                        dataInicio: item["Data Início"] ? item["Data Início"].trim() : '',
                        dataFim: item["Data Fim"] ? item["Data Fim"].trim() : '',
                        codigo: item.Código ? item.Código.trim().toUpperCase() : ''
                    })).filter(item => item.funcionario && item.dataInicio && item.codigo); // Filtrar registros válidos
                    console.log('Dados Processados:', data);
                    saveData();
                    renderTable();
                    showMessage('Dados carregados com sucesso!', 'success');
                },
                error: function(error) {
                    console.error('Erro ao analisar o CSV:', error);
                    showMessage('Erro ao analisar o CSV: ' + error.message, 'error');
                }
            });
        })
        .catch(error => {
            console.error('Erro ao buscar o CSV:', error);
            showMessage('Erro ao carregar o arquivo CSV. Verifique o console para mais detalhes.', 'error');
        });
}

// ==============================
// 4. Funções de Renderização
// ==============================

/**
 * Renderiza a tabela com os registros e destaca sobreposições
 */
function renderTable() {
    tableBody.innerHTML = '';
    const filteredData = getFilteredData();
    console.log('Dados Filtrados para Tabela:', filteredData);

    // Mapeamento para identificar sobreposições
    const overlapIndices = new Set();

    // Iterar sobre todos os registros filtrados para identificar sobreposições
    for (let i = 0; i < filteredData.length; i++) {
        for (let j = i + 1; j < filteredData.length; j++) {
            const itemA = filteredData[i].item;
            const itemB = filteredData[j].item;

            // Verificar se é o mesmo funcionário e se ambos têm dataFim
            if (itemA.funcionario === itemB.funcionario && itemA.dataFim && itemB.dataFim) {
                if (periodsOverlap(itemA.dataInicio, itemA.dataFim, itemB.dataInicio, itemB.dataFim)) {
                    overlapIndices.add(filteredData[i].index);
                    overlapIndices.add(filteredData[j].index);
                }
            }
        }
    }

    // Renderizar cada registro na tabela
    filteredData.forEach(({ item, index }) => {
        const tr = document.createElement('tr');

        // Aplicar classe se houver sobreposição
        if (overlapIndices.has(index)) {
            tr.classList.add('overlap'); // Classe CSS para destacar
        }

        const tdFuncionario = document.createElement('td');
        tdFuncionario.textContent = item.funcionario;
        tr.appendChild(tdFuncionario);

        const tdMes = document.createElement('td');
        tdMes.textContent = getMonthFromDate(item.dataInicio) || 'N/A';
        tr.appendChild(tdMes);

        const tdDataInicio = document.createElement('td');
        tdDataInicio.textContent = formatDate(item.dataInicio) || 'N/A';
        tr.appendChild(tdDataInicio);

        const tdDataFim = document.createElement('td');
        tdDataFim.textContent = formatDate(item.dataFim) || '-';
        tr.appendChild(tdDataFim);

        const tdCodigo = document.createElement('td');
        const span = document.createElement('span');
        span.classList.add('codigo-badge');
        span.textContent = item.codigo || 'N/A'; // Exibir 'N/A' se o código estiver vazio

        // Definir o tooltip com base no código
        switch(item.codigo) {
            case 'F':
                span.setAttribute('data-tooltip', 'Férias');
                break;
            case 'M':
                span.setAttribute('data-tooltip', 'Marcada');
                break;
            case 'D':
                span.setAttribute('data-tooltip', 'Aguarda aprovação do DP');
                break;
            case 'ME':
                span.setAttribute('data-tooltip', 'Médico');
                break;
            default:
                span.setAttribute('data-tooltip', 'Código Desconhecido');
        }

        tdCodigo.appendChild(span);
        tr.appendChild(tdCodigo);

        // Nova Coluna para Dias
        const tdDias = document.createElement('td');
        if (item.dataFim) {
            const dias = calculateDays(item.dataInicio, item.dataFim);
            tdDias.textContent = dias !== null ? dias : 'N/A';
        } else {
            tdDias.textContent = 'N/A';
        }
        tr.appendChild(tdDias);

        const tdAcoes = document.createElement('td');
        tdAcoes.classList.add('actions');

        // Botão Editar
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.classList.add('edit');
        editBtn.onclick = () => openEditModal(index); // Passa o índice correto
        tdAcoes.appendChild(editBtn);

        // Botão Deletar
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.classList.add('delete');
        deleteBtn.onclick = () => deleteRecord(index);
        tdAcoes.appendChild(deleteBtn);

        // (Opcional) Ícone de Alerta para Sobreposição
        if (overlapIndices.has(index)) {
            const alertIcon = document.createElement('span');
            alertIcon.innerHTML = '<i class="fas fa-exclamation-triangle" title="Férias Sobrepostas"></i>';
            alertIcon.style.color = '#dc3545'; // Cor vermelha
            alertIcon.style.marginLeft = '10px';
            tdAcoes.appendChild(alertIcon);
        }

        tr.appendChild(tdAcoes);

        tableBody.appendChild(tr);
    });

    updateStats();
    updateCharts();
    generateOverlapReport(); // Gerar relatório de sobreposições
}

/**
 * Atualiza as estatísticas no dashboard
 */
function updateStats() {
    const filtered = getFilteredData();
    console.log('Estatísticas Atualizadas:', filtered);

    totalRecords.textContent = filtered.length;
    uniqueEmployees.textContent = new Set(filtered.map(({ item }) => item.funcionario)).size;
    activeMonths.textContent = new Set(filtered.map(({ item }) => getMonthFromDate(item.dataInicio))).size;
}

/**
 * Gera um relatório de sobreposições e atualiza a seção correspondente
 */
function generateOverlapReport() {
    const overlapReportBody = document.getElementById('overlapTableBody');
    if (!overlapReportBody) return; // Se a seção não existir, não faz nada

    overlapReportBody.innerHTML = ''; // Limpar conteúdo anterior

    const filteredData = getFilteredData();
    const overlaps = [];

    // Identificar todas as sobreposições
    for (let i = 0; i < filteredData.length; i++) {
        for (let j = i + 1; j < filteredData.length; j++) {
            const itemA = filteredData[i].item;
            const itemB = filteredData[j].item;

            if (itemA.funcionario === itemB.funcionario && itemA.dataFim && itemB.dataFim) {
                if (periodsOverlap(itemA.dataInicio, itemA.dataFim, itemB.dataInicio, itemB.dataFim)) {
                    overlaps.push({
                        funcionario: itemA.funcionario,
                        periodo1: `${formatDate(itemA.dataInicio)} a ${formatDate(itemA.dataFim)}`,
                        periodo2: `${formatDate(itemB.dataInicio)} a ${formatDate(itemB.dataFim)}`
                    });
                }
            }
        }
    }

    // Remover duplicatas
    const uniqueOverlaps = [];
    const seen = new Set();

    overlaps.forEach(overlap => {
        const key = `${overlap.funcionario}-${overlap.periodo1}-${overlap.periodo2}`;
        const reverseKey = `${overlap.funcionario}-${overlap.periodo2}-${overlap.periodo1}`;
        if (!seen.has(key) && !seen.has(reverseKey)) {
            uniqueOverlaps.push(overlap);
            seen.add(key);
        }
    });

    // Adicionar ao relatório
    uniqueOverlaps.forEach(overlap => {
        const tr = document.createElement('tr');

        const tdFuncionario = document.createElement('td');
        tdFuncionario.textContent = overlap.funcionario;
        tr.appendChild(tdFuncionario);

        const tdPeriodo1 = document.createElement('td');
        tdPeriodo1.textContent = overlap.periodo1;
        tr.appendChild(tdPeriodo1);

        const tdPeriodo2 = document.createElement('td');
        tdPeriodo2.textContent = overlap.periodo2;
        tr.appendChild(tdPeriodo2);

        overlapReportBody.appendChild(tr);
    });

    // Exibir notificação se houver sobreposições
    const overlapCount = uniqueOverlaps.length;
    if (overlapCount > 0) {
        showMessage(`${overlapCount} sobreposição(s) de férias detectada(s).`, 'warning');
    } else {
        showMessage('Nenhuma sobreposição de férias detectada.', 'success');
    }
}

// ==============================
// 5. Funções de Filtragem
// ==============================

/**
 * Obtém os dados filtrados com base nos inputs de busca e filtros
 * @returns {Array} Array de objetos com { item, index }
 */
function getFilteredData() {
    return data.reduce((acc, item, index) => {
        const searchValue = searchInput.value.toLowerCase();
        const selectedMonth = monthFilter.value;
        const selectedCode = codeFilter.value;

        const matchesSearch = item.funcionario.toLowerCase().includes(searchValue);
        const matchesMonth = selectedMonth === 'all' || getMonthFromDate(item.dataInicio) === selectedMonth;
        const matchesCode = selectedCode === 'all' || item.codigo === selectedCode;

        if (matchesSearch && matchesMonth && matchesCode) {
            acc.push({ item, index });
        }

        return acc;
    }, []);
}

// ==============================
// 6. Funções de Exportação
// ==============================

/**
 * Exporta os dados filtrados para um arquivo PDF
 */
function exportToPDF() {
    // Criar uma nova instância do jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Adicionar título
    doc.setFontSize(18);
    doc.text('Relatório de Agendamentos', 14, 22);

    // Adicionar Data de Geração
    doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30);

    // Preparar os dados para a tabela
    const filteredData = getFilteredData();
    const tableColumn = ["Funcionário", "Mês", "Data Início", "Data Fim", "Código", "Dias"];
    const tableRows = [];

    filteredData.forEach(({ item }) => {
        const rowData = [
            item.funcionario,
            getMonthFromDate(item.dataInicio) || 'N/A',
            formatDate(item.dataInicio) || 'N/A',
            formatDate(item.dataFim) || '-',
            item.codigo || 'N/A',
            item.dataFim ? calculateDays(item.dataInicio, item.dataFim) : 'N/A'
        ];
        tableRows.push(rowData);
    });

    // Adicionar a tabela ao PDF usando AutoTable
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { halign: 'left', fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Salvar o PDF
    doc.save('relatorio_agendamentos.pdf');
}

/**
 * Exporta os dados filtrados para um arquivo Excel
 */
function exportToExcel() {
    // Preparar os dados
    const filteredData = getFilteredData();
    const worksheetData = [
        ["Funcionário", "Mês", "Data Início", "Data Fim", "Código", "Dias"]
    ];

    filteredData.forEach(({ item }) => {
        worksheetData.push([
            item.funcionario,
            getMonthFromDate(item.dataInicio) || 'N/A',
            formatDate(item.dataInicio) || 'N/A',
            formatDate(item.dataFim) || '-',
            item.codigo || 'N/A',
            item.dataFim ? calculateDays(item.dataInicio, item.dataFim) : 'N/A'
        ]);
    });

    // Criar uma nova planilha
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    // Criar um novo workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos");

    // Gerar o arquivo Excel e forçar o download
    XLSX.writeFile(workbook, 'relatorio_agendamentos.xlsx');
}

// ==============================
// 7. Funções de Interface e Interação
// ==============================

/**
 * Exibe mensagens de feedback ao usuário
 * @param {string} text - Texto da mensagem
 * @param {string} type - Tipo da mensagem ('success', 'error', 'warning', 'info')
 */
function showMessage(text, type) {
    if (!text) {
        message.style.display = 'none';
        return;
    }
    message.textContent = text;
    message.className = 'message'; // Resetar classes
    if (type === 'success') {
        message.classList.add('success');
    } else if (type === 'error') {
        message.classList.add('error');
    } else if (type === 'warning') {
        message.classList.add('warning');
    } else if (type === 'info') {
        message.classList.add('info');
    }
    message.style.display = 'block';
    // Ocultar a mensagem após 5 segundos
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

/**
 * Atualiza os gráficos no dashboard
 */
function updateCharts() {
    const filtered = getFilteredData();
    console.log('Dados para Gráficos:', filtered);

    // Distribuição por Código
    const codeCounts = filtered.reduce((acc, { item }) => {
        acc[item.codigo] = (acc[item.codigo] || 0) + 1;
        return acc;
    }, {});

    const codeLabels = Object.keys(codeCounts);
    const codeData = Object.values(codeCounts);

    if (codeChart) {
        codeChart.destroy();
    }

    const ctxCode = document.getElementById('codeChart').getContext('2d');
    codeChart = new Chart(ctxCode, {
        type: 'bar',
        data: {
            labels: codeLabels,
            datasets: [{
                label: 'Quantidade',
                data: codeData,
                backgroundColor: '#4f46e5',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    // Distribuição por Mês
    const monthCounts = {};

    filtered.forEach(({ item }) => {
        const month = getMonthFromDate(item.dataInicio);
        if (month) {
            monthCounts[month] = (monthCounts[month] || 0) + 1;
        }
    });

    const monthLabels = Object.keys(monthCounts);
    const monthData = Object.values(monthCounts);

    // Verificar se há dados para o gráfico
    if (monthLabels.length === 0) {
        // Opcional: Exibir uma mensagem ou gráfico vazio
        if (monthChart) {
            monthChart.destroy();
        }
        // Limpar o canvas
        const ctxMonthEmpty = document.getElementById('monthChart').getContext('2d');
        ctxMonthEmpty.clearRect(0, 0, ctxMonthEmpty.canvas.width, ctxMonthEmpty.canvas.height);
        return;
    }

    if (monthChart) {
        monthChart.destroy();
    }

    const ctxMonth = document.getElementById('monthChart').getContext('2d');
    monthChart = new Chart(ctxMonth, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Quantidade',
                data: monthData,
                backgroundColor: '#4f46e5',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// ==============================
// 8. Funções de Manipulação de Registros
// ==============================

/**
 * Abre o modal para adicionar um novo registro
 */
function openAddModal() {
    isEditing = false;
    editingIndex = null;
    modalTitle.textContent = 'Adicionar Registro';
    recordForm.reset();
    dataFimInput.required = false;
    dataFimInput.classList.remove('required');
    showMessage('', ''); // Limpar mensagens
    modal.style.display = 'block';
}

/**
 * Abre o modal para editar um registro existente
 * @param {number} index - Índice do registro no array de dados
 */
function openEditModal(index) {
    isEditing = true;
    editingIndex = index;
    const record = data[index];
    console.log(`Abrindo Modal para Edição do Índice ${index}:`, record);

    modalTitle.textContent = 'Editar Registro';
    document.getElementById('funcionario').value = record.funcionario;
    document.getElementById('codigo').value = record.codigo;
    document.getElementById('dataInicio').value = record.dataInicio;
    document.getElementById('dataFim').value = record.dataFim;

    // Gerenciar obrigatoriedade do campo Data Fim
    if (record.codigo === 'ME') {
        dataFimInput.required = true;
        dataFimInput.classList.add('required');
    } else {
        dataFimInput.required = false;
        dataFimInput.classList.remove('required');
    }

    showMessage('', ''); // Limpar mensagens
    modal.style.display = 'block';
}

/**
 * Deleta um registro do array de dados
 * @param {number} index - Índice do registro no array de dados
 */
function deleteRecord(index) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        console.log(`Deletando Registro no Índice ${index}:`, data[index]);
        data.splice(index, 1);
        saveData();
        renderTable();
        showMessage('Registro excluído com sucesso!', 'success');
    }
}

// ==============================
// 9. Event Listeners
// ==============================

// Evento para abrir o modal de adicionar registro
addButton.addEventListener('click', openAddModal);

// Evento para fechar o modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Fechar o modal ao clicar fora dele
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});

// Evento para manipular a submissão do formulário (Adicionar ou Editar)
recordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const funcionario = document.getElementById('funcionario').value.trim();
    const codigo = document.getElementById('codigo').value.toUpperCase();
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = dataFimInput.value;

    // Validação dos campos obrigatórios
    if (!funcionario || !codigo || !dataInicio || (codigo === 'ME' && !dataFim)) {
        showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    // Validação adicional: dataFim deve ser maior ou igual a dataInicio
    if (dataFim && new Date(dataFim) < new Date(dataInicio)) {
        showMessage('A Data Fim deve ser maior ou igual à Data Início.', 'error');
        return;
    }

    // (Opcional) Verificar sobreposição de férias (se desejar bloquear sobreposições)
    /*
    if (codigo === 'F') { // Supondo que 'F' representa férias
        if (hasOverlap(funcionario, dataInicio, dataFim, isEditing ? editingIndex : null)) {
            showMessage('O período de férias se sobrepõe a outro já existente para este funcionário.', 'error');
            return;
        }
    }
    /*

    if (isEditing && editingIndex !== null) {
        // Editar Registro
        data[editingIndex] = { ...data[editingIndex], funcionario, codigo, dataInicio, dataFim };
        console.log(`Registro Editado no Índice ${editingIndex}:`, data[editingIndex]);
    } else {
        // Adicionar Novo Registro
        const newRecord = { id: generateUniqueId(), funcionario, codigo, dataInicio, dataFim };
        data.push(newRecord);
        console.log('Novo Registro Adicionado:', newRecord);
    }

    saveData();
    renderTable();
    modal.style.display = 'none';
    showMessage('Registro salvo com sucesso!', 'success');
});

// Evento para filtrar a tabela ao digitar no campo de busca
searchInput.addEventListener('input', renderTable);

// Evento para filtrar a tabela ao selecionar um mês
monthFilter.addEventListener('change', renderTable);

// Evento para filtrar a tabela ao selecionar um código
codeFilter.addEventListener('change', renderTable);

// Gerenciar obrigatoriedade do campo Data Fim baseado na seleção do código
codigoSelect.addEventListener('change', function() {
    const selectedCode = this.value;
    if (selectedCode === 'ME') {
        dataFimInput.required = true;
        dataFimInput.classList.add('required');
    } else {
        dataFimInput.required = false;
        dataFimInput.classList.remove('required');
    }
});

// Evento para carregar o CSV ao selecionar um arquivo
csvInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
        initializeDataFromCSV(file);
    } else {
        showMessage('Por favor, selecione um arquivo CSV válido.', 'error');
    }
});

// Evento para forçar o carregamento do CSV
forceLoadButton.addEventListener('click', () => {
    loadCSVAutomatically();
});

// Evento para resetar os dados e recarregar o CSV original
resetButton.addEventListener('click', () => {
    if (confirm('Isso limpará todos os dados e recarregará o CSV original. Deseja continuar?')) {
        localStorage.removeItem('dashboardData');
        loadCSVAutomatically();
    }
});

// Evento para exportar os dados para PDF
exportPdfButton.addEventListener('click', exportToPDF);

// Evento para exportar os dados para Excel
exportExcelButton.addEventListener('click', exportToExcel);

// ==============================
// 10. Função para Inicializar a Aplicação
// ==============================

/**
 * Inicializa a aplicação carregando os dados
 */
function init() {
    loadData();
}

// Chamar a função de inicialização quando a janela for carregada
window.onload = init;
