/// script.js

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

  // Crear un nuevo pedido
  const newOrder = {
    customerName,
    customerPhone,
    customerEmail,
    productReference,
    description,
    date: new Date().toLocaleString()
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
      <td>${order.customerName}</td>
      <td>${order.customerPhone}</td>
      <td>${order.customerEmail}</td>
      <td>${order.productReference}</td>
      <td>${order.description}</td>
      <td class="actions">
        <button class="delete" onclick="deleteOrder(${index})">Eliminar</button>
        <button class="generate-pdf" onclick="generatePDF(${index})">Generar Nota</button>
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
  doc.text('Descripción:', 20, 80);
  doc.text(order.description, 20, 90, { maxWidth: 170 });

  doc.save(`Pedido_${order.customerName.replace(/\s+/g, '_')}.pdf`);
}
