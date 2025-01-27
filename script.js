// Selección de elementos del DOM
const form = document.getElementById('orderForm');
const ordersTableBody = document.querySelector('#ordersTable tbody');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const showChartBtn = document.getElementById('showChartBtn');
const chartSection = document.getElementById('chartSection');
const ordersChart = document.getElementById('ordersChart');

// Cargar pedidos desde localStorage al iniciar
let orders = JSON.parse(localStorage.getItem('orders')) || [];

// Renderizar los pedidos guardados
renderOrders(orders);

// Manejar el envío del formulario
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Obtener datos del formulario
  const customerName = document.getElementById('customerName').value;
  const customerPhone = document.getElementById('customerPhone').value;
  const customerEmail = document.getElementById('customerEmail').value;
  const productReference = document.getElementById('productReference').value;
  const description = document.getElementById('description').value;
  const priority = document.getElementById('priority').value;

  // Crear un nuevo pedido
  const newOrder = {
    customerName,
    customerPhone,
    customerEmail,
    productReference,
    description,
    priority,
    status: 'pendiente', // Estado inicial
    date: new Date().toLocaleString(),
    id: Date.now().toString() // ID único
  };

  // Agregar el nuevo pedido a la lista y guardar en localStorage
  orders.push(newOrder);
  localStorage.setItem('orders', JSON.stringify(orders));

  // Renderizar los pedidos actualizados
  renderOrders(orders);

  // Mostrar confirmación
  alert('Pedido agregado con éxito.');

  // Limpiar el formulario
  form.reset();
});

// Renderizar la lista de pedidos
function renderOrders(ordersToRender) {
  ordersTableBody.innerHTML = '';

  ordersToRender.forEach((order, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Prioridad"><span class="priority ${order.priority}">${order.priority}</span></td>
      <td data-label="Estado"><span class="status ${order.status}" onclick="toggleStatus(${index})">${order.status}</span></td>
      <td data-label="Cliente">${order.customerName}</td>
      <td data-label="Teléfono">${order.customerPhone}</td>
      <td data-label="Correo">${order.customerEmail}</td>
      <td data-label="Referencia">${order.productReference}</td>
      <td data-label="Descripción">${order.description}</td>
      <td class="actions" data-label="Acciones">
        <button class="delete" onclick="deleteOrder(${index})">🗑️</button>
        <button class="generate-pdf" onclick="generatePDF(${index})">📄</button>
      </td>
    `;
    ordersTableBody.appendChild(row);
  });
}

// Eliminar un pedido
function deleteOrder(index) {
  if (confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
    orders.splice(index, 1);
    localStorage.setItem('orders', JSON.stringify(orders));
    renderOrders(orders);
    alert('Pedido eliminado con éxito.');
  }
}

// Cambiar estado de un pedido
function toggleStatus(index) {
  const statuses = ['pendiente', 'en-proceso', 'completado'];
  const currentIndex = statuses.indexOf(orders[index].status);
  orders[index].status = statuses[(currentIndex + 1) % 3]; // Cambiar al siguiente estado
  localStorage.setItem('orders', JSON.stringify(orders));
  renderOrders(orders);
}

// Filtrar pedidos según la búsqueda
searchBtn.addEventListener('click', function () {
  const query = searchInput.value.toLowerCase().trim();

  // Si no hay nada escrito, muestra todos los pedidos
  if (!query) {
    renderOrders(orders);
    return;
  }

  // Filtrar los pedidos
  const filteredOrders = orders.filter(order =>
    Object.values(order).some(value =>
      value.toString().toLowerCase().includes(query)
    )
  );

  renderOrders(filteredOrders);
});

// Mostrar/ocultar la sección de gráficas
showChartBtn.addEventListener('click', function () {
  if (chartSection.style.display === 'none') {
    chartSection.style.display = 'block';
    generateChart();
    showChartBtn.textContent = 'Ocultar Gráficas';
  } else {
    chartSection.style.display = 'none';
    showChartBtn.textContent = 'Mostrar Gráficas';
  }
});

// Generar la gráfica de productos más pedidos
function generateChart() {
  const productCounts = orders.reduce((acc, order) => {
    acc[order.productReference] = (acc[order.productReference] || 0) + 1;
    return acc;
  }, {});

  const productLabels = Object.keys(productCounts);
  const productData = Object.values(productCounts);

  if (ordersChart.chart) {
    ordersChart.chart.destroy();
  }

  ordersChart.chart = new Chart(ordersChart, {
    type: 'bar',
    data: {
      labels: productLabels,
      datasets: [{
        label: 'Cantidad de Pedidos',
        data: productData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Generar PDF de un pedido
function generatePDF(index) {
  const { jsPDF } = window.jspdf;
  const order = orders[index];
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Nota de Pedido', 20, 20);

  doc.setFontSize(12);
  doc.text(`Fecha: ${order.date}`, 20, 30);
  doc.text(`Nombre del Cliente: ${order.customerName}`, 20, 40);
  doc.text(`Teléfono: ${order.customerPhone}`, 20, 50);
  doc.text(`Correo Electrónico: ${order.customerEmail}`, 20, 60);
  doc.text(`Referencia del Producto: ${order.productReference}`, 20, 70);
  doc.text(`Prioridad: ${order.priority}`, 20, 80);
  doc.text(`Estado: ${order.status}`, 20, 90);
  doc.text('Descripción:', 20, 100);
  doc.text(order.description, 20, 110, { maxWidth: 170 });

  doc.save(`Pedido_${order.customerName.replace(/\s+/g, '_')}.pdf`);
}

// Exportar datos a JSON
function exportData() {
  const dataStr = JSON.stringify(orders);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Importar datos desde JSON
document.getElementById('importFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error();

      if (confirm(`¿Importar ${imported.length} pedidos? Se perderán los datos actuales.`)) {
        orders = imported;
        localStorage.setItem('orders', JSON.stringify(orders));
        renderOrders(orders);
        alert('Pedidos importados con éxito.');
      }
    } catch {
      alert('Error: Archivo no válido');
    }
  };
  reader.readAsText(file);
});

// Scroll para menú móvil
function scrollToSection(sectionId) {
  document.getElementById(sectionId).scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}