// Elementos do DOM
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

let data = [];

// Gráficos
let codeChart;
let monthChart;

// Estado para Edição
let isEditing = false;
let editingIndex = null;

// Inicializar Dados a partir do CSV
function initializeDataFromCSV(file) {
    showMessage('Carregando dados...', 'info');
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('CSV Parsing Complete:', results);
            data = results.data.map(item => ({
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

// Carregar CSV ao selecionar o arquivo (opcional)
csvInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
        initializeDataFromCSV(file);
    } else {
        showMessage('Por favor, selecione um arquivo CSV válido.', 'error');
    }
});

// Forçar Carregamento do CSV
forceLoadButton.addEventListener('click', () => {
    loadCSVAutomatically();
});

// Salvar Dados no localStorage (opcional, caso queira persistir)
function saveData() {
    localStorage.setItem('dashboardData', JSON.stringify(data));
}

// Selecionar os novos botões de exportação
const exportPdfButton = document.getElementById('exportPdfButton');
const exportExcelButton = document.getElementById('exportExcelButton');

// Função para verificar se há sobreposição de férias para o mesmo funcionário
function hasOverlap(funcionario, dataInicio, dataFim, excludeIndex = null) {
    // Converter as datas para objetos Date
    const newStart = new Date(dataInicio);
    const newEnd = new Date(dataFim);
    
    // Iterar sobre todos os registros
    for (let i = 0; i < data.length; i++) {
        // Excluir o registro atual em caso de edição
        if (excludeIndex !== null && i === excludeIndex) continue;
        
        const record = data[i];
        
        // Verificar apenas para o mesmo funcionário e se possui Data Fim
        if (record.funcionario === funcionario && record.dataFim) {
            const existingStart = new Date(record.dataInicio);
            const existingEnd = new Date(record.dataFim);
            
            // Verificar se há sobreposição
            if ((newStart <= existingEnd) && (newEnd >= existingStart)) {
                return true;
            }
        }
    }
    
    return false;
}

// Função para Exportar para PDF
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

// Função para Exportar para Excel
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

    // Aplicar estilos básicos (opcional)
    // Nota: A aplicação de estilos complexos em Excel via SheetJS pode ser limitada na versão gratuita.

    // Gerar o arquivo Excel e forçar o download
    XLSX.writeFile(workbook, 'relatorio_agendamentos.xlsx');
}

// Adicionar Event Listeners aos Botões de Exportação
exportPdfButton.addEventListener('click', exportToPDF);
exportExcelButton.addEventListener('click', exportToExcel);

// Filtros
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

// Função para verificar se dois períodos de férias se sobrepõem
function periodsOverlap(startA, endA, startB, endB) {
    return (new Date(startA) <= new Date(endB)) && (new Date(endA) >= new Date(startB));
}


// Renderizar Tabela
function renderTable() {
    tableBody.innerHTML = '';
    const filteredData = getFilteredData();
    console.log('Dados Filtrados para Tabela:', filteredData);

    // Mapeamento para identificar sobreposições
    const overlapIndices = new Set();

    // Iterar sobre todos os registros para identificar sobreposições
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

        tr.appendChild(tdAcoes);

        tableBody.appendChild(tr);
    });

    updateStats();
    updateCharts();
}

// Função para formatar a data para DD/MM/AAAA
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr; // Se já estiver no formato desejado
    const day = String(date.getDate()).padStart(2, '0');
    const month = String((date.getMonth() + 1)).padStart(2, '0'); // Meses começam em 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Função para calcular a diferença de dias entre duas datas
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

// Atualizar Estatísticas
function updateStats() {
    const filtered = getFilteredData();
    console.log('Estatísticas Atualizadas:', filtered);

    totalRecords.textContent = filtered.length;
    uniqueEmployees.textContent = new Set(filtered.map(({ item }) => item.funcionario)).size;
    activeMonths.textContent = new Set(filtered.map(({ item }) => getMonthFromDate(item.dataInicio))).size;
}

// Adicionar Evento de Filtro
searchInput.addEventListener('input', renderTable);
monthFilter.addEventListener('change', renderTable);
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

// Abrir Modal para Adicionar
addButton.addEventListener('click', () => {
    isEditing = false;
    editingIndex = null;
    modalTitle.textContent = 'Adicionar Registro';
    recordForm.reset();
    dataFimInput.required = false;
    dataFimInput.classList.remove('required');
    showMessage('', ''); // Limpar mensagens
    modal.style.display = 'block';
});

// Fechar Modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Fechar Modal ao Clicar Fora
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});

// Adicionar ou Editar Registro
recordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const funcionario = document.getElementById('funcionario').value.trim();
    const codigo = document.getElementById('codigo').value.toUpperCase();
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = dataFimInput.value;

    if (!funcionario || !codigo || !dataInicio || (codigo === 'ME' && !dataFim)) {
        showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    // Validação adicional: dataFim deve ser maior ou igual a dataInicio
    if (dataFim && new Date(dataFim) < new Date(dataInicio)) {
        showMessage('A Data Fim deve ser maior ou igual à Data Início.', 'error');
        return;
    }

    // Verificar sobreposição de férias
    if (codigo === 'F') { // Supondo que 'F' representa férias
        if (hasOverlap(funcionario, dataInicio, dataFim, isEditing ? editingIndex : null)) {
            showMessage('O período de férias se sobrepõe a outro já existente para este funcionário.', 'error');
            return;
        }
    }

    if (isEditing && editingIndex !== null) {
        // Editar Registro
        data[editingIndex] = { funcionario, codigo, dataInicio, dataFim };
        console.log(`Registro Editado no Índice ${editingIndex}:`, data[editingIndex]);
    } else {
        // Adicionar Novo Registro
        data.push({ funcionario, codigo, dataInicio, dataFim });
        console.log('Novo Registro Adicionado:', data[data.length - 1]);
    }

    saveData();
    renderTable();
    modal.style.display = 'none';
    showMessage('Registro salvo com sucesso!', 'success');
});

// Abrir Modal para Edição
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

// Deletar Registro
function deleteRecord(index) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        console.log(`Deletando Registro no Índice ${index}:`, data[index]);
        data.splice(index, 1);
        saveData();
        renderTable();
        showMessage('Registro excluído com sucesso!', 'success');
    }
}

// Gráficos
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

// Função para Carregar o CSV Automaticamente
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

// Função para formatar a data do CSV para YYYY-MM-DD (já está no formato correto)
function formatCSVDate(dateStr) {
    // Com o data.csv agora no formato YYYY-MM-DD, apenas validamos a data
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    return dateStr;
}

// Botão de Reset (opcional)
resetButton.addEventListener('click', () => {
    if (confirm('Isso limpará todos os dados e recarregará o CSV original. Deseja continuar?')) {
        localStorage.removeItem('dashboardData');
        loadCSVAutomatically();
    }
});

// Função para Mostrar Mensagens de Verificação
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
    } else if (type === 'info') {
        message.classList.add('info');
    }
    message.style.display = 'block';
    // Ocultar a mensagem após 5 segundos
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

// Inicializar Aplicação
function init() {
    // Tentar carregar dados do localStorage
    const storedData = localStorage.getItem('dashboardData');
    if (storedData) {
        data = JSON.parse(storedData);
        console.log('Dados Carregados do localStorage:', data);
        renderTable();
        showMessage('Dados carregados do armazenamento local.', 'success');
    } else {
        // Carregar dados do arquivo CSV automaticamente
        loadCSVAutomatically();
    }
}

window.onload = init;
