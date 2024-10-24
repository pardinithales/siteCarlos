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
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            data = results.data.map(item => ({
                funcionario: item.funcionario.trim(),
                mes: item.mes.trim(),
                codigo: item.codigo.trim().toUpperCase()
            }));
            saveData();
            renderTable();
        },
        error: function(error) {
            alert('Erro ao carregar o CSV: ' + error.message);
        }
    });
}

// Carregar CSV ao selecionar o arquivo
csvInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
        initializeDataFromCSV(file);
    } else {
        alert('Por favor, selecione um arquivo CSV válido.');
    }
});

// Salvar Dados no localStorage
function saveData() {
    localStorage.setItem('dashboardData', JSON.stringify(data));
}

// Renderizar Tabela
function renderTable() {
    tableBody.innerHTML = '';
    const filteredData = getFilteredData();

    filteredData.forEach((item, index) => {
        const tr = document.createElement('tr');

        const tdFuncionario = document.createElement('td');
        tdFuncionario.textContent = item.funcionario;
        tr.appendChild(tdFuncionario);

        const tdMes = document.createElement('td');
        tdMes.textContent = item.mes;
        tr.appendChild(tdMes);

        const tdCodigo = document.createElement('td');
        const span = document.createElement('span');
        span.classList.add('codigo-badge');
        span.textContent = item.codigo;
        // Adicionar estilo baseado no código
        switch(item.codigo) {
            case 'F':
                span.style.backgroundColor = '#EDE9FE';
                span.style.color = '#6B21A8';
                break;
            case 'M':
                span.style.backgroundColor = '#DCFCE7';
                span.style.color = '#059669';
                break;
            case 'D':
                span.style.backgroundColor = '#FEF3C7';
                span.style.color = '#D97706';
                break;
            default:
                span.style.backgroundColor = '#E5E7EB';
                span.style.color = '#4B5563';
        }
        span.style.padding = '5px 10px';
        span.style.borderRadius = '20px';
        span.style.fontSize = '0.8em';
        tdCodigo.appendChild(span);
        tr.appendChild(tdCodigo);

        const tdAcoes = document.createElement('td');
        tdAcoes.classList.add('actions');

        // Botão Editar
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.classList.add('edit');
        editBtn.onclick = () => openEditModal(index);
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

// Filtros
function getFilteredData() {
    let filtered = [...data];

    const searchValue = searchInput.value.toLowerCase();
    const selectedMonth = monthFilter.value;
    const selectedCode = codeFilter.value;

    if (searchValue) {
        filtered = filtered.filter(item => item.funcionario.toLowerCase().includes(searchValue));
    }

    if (selectedMonth !== 'all') {
        filtered = filtered.filter(item => item.mes === selectedMonth);
    }

    if (selectedCode !== 'all') {
        filtered = filtered.filter(item => item.codigo === selectedCode);
    }

    return filtered;
}

// Atualizar Estatísticas
function updateStats() {
    const filtered = getFilteredData();

    totalRecords.textContent = filtered.length;
    uniqueEmployees.textContent = new Set(filtered.map(item => item.funcionario)).size;
    activeMonths.textContent = new Set(filtered.map(item => item.mes)).size;
}

// Adicionar Evento de Filtro
searchInput.addEventListener('input', renderTable);
monthFilter.addEventListener('change', renderTable);
codeFilter.addEventListener('change', renderTable);

// Abrir Modal para Adicionar
addButton.addEventListener('click', () => {
    isEditing = false;
    editingIndex = null;
    modalTitle.textContent = 'Adicionar Registro';
    recordForm.reset();
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
    const mes = document.getElementById('mes').value;
    const codigo = document.getElementById('codigo').value.toUpperCase();

    if (isEditing && editingIndex !== null) {
        // Editar Registro
        data[editingIndex] = { funcionario, mes, codigo };
    } else {
        // Adicionar Novo Registro
        data.push({ funcionario, mes, codigo });
    }

    saveData();
    renderTable();
    modal.style.display = 'none';
});

// Abrir Modal para Edição
function openEditModal(index) {
    isEditing = true;
    editingIndex = index;
    const record = data[index];

    modalTitle.textContent = 'Editar Registro';
    document.getElementById('funcionario').value = record.funcionario;
    document.getElementById('mes').value = record.mes;
    document.getElementById('codigo').value = record.codigo;
    modal.style.display = 'block';
}

// Deletar Registro
function deleteRecord(index) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        data.splice(index, 1);
        saveData();
        renderTable();
    }
}

// Gráficos
function updateCharts() {
    const filtered = getFilteredData();

    // Distribuição por Código
    const codeCounts = filtered.reduce((acc, item) => {
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
    const monthCounts = filtered.reduce((acc, item) => {
        acc[item.mes] = (acc[item.mes] || 0) + 1;
        return acc;
    }, {});

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
// Gráficos
function updateCharts() {
    const filtered = getFilteredData();

    // Distribuição por Código
    const codeCounts = filtered.reduce((acc, item) => {
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
    const monthCounts = filtered.reduce((acc, item) => {
        acc[item.mes] = (acc[item.mes] || 0) + 1;
        return acc;
    }, {});

    const monthLabels = Object.keys(monthCounts);
    const monthData = Object.values(monthCounts);

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


// Inicializar Aplicação
function init() {
    // Tentar carregar dados do localStorage
    const storedData = localStorage.getItem('dashboardData');
    if (storedData) {
        data = JSON.parse(storedData);
        renderTable();
    } else {
        // Se não houver dados no localStorage, tentar carregar do CSV
        // Opcional: Carregar dados do arquivo CSV automaticamente
        // Nota: Devido a restrições de CORS, isso pode não funcionar ao abrir o arquivo via file://
        // Para contornar, considere servir o projeto via um servidor local simples
        /*
        fetch('data.csv')
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        data = results.data.map(item => ({
                            funcionario: item.funcionario.trim(),
                            mes: item.mes.trim(),
                            codigo: item.codigo.trim().toUpperCase()
                        }));
                        saveData();
                        renderTable();
                    },
                    error: function(error) {
                        alert('Erro ao carregar o CSV: ' + error.message);
                    }
                });
            })
            .catch(error => {
                console.error('Erro ao buscar o CSV:', error);
            });
        */
        // Para facilitar, você pode instruir os usuários a carregar manualmente o CSV usando o botão
    }
}

window.onload = init;
