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
const codigoSelect = document.getElementById('codigo'); // Seleção de Código
const dataFimContainer = document.getElementById('dataFimContainer'); // Container do Data Fim
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

// Salvar Dados no localStorage (opcional, caso queira persistir)
function saveData() {
    localStorage.setItem('dashboardData', JSON.stringify(data));
}

// Renderizar Tabela
function renderTable() {
    tableBody.innerHTML = '';
    const filteredData = getFilteredData();
    console.log('Dados Filtrados para Tabela:', filteredData);

    filteredData.forEach((item, index) => {
        const tr = document.createElement('tr');

        const tdFuncionario = document.createElement('td'
