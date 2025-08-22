// DOM elements
const hostelsWrap = document.getElementById('hostelsWrap');
const hostelCountInput = document.getElementById('hostelCount');
const genHostelsBtn = document.getElementById('genHostelsBtn');
const allocateBtn = document.getElementById('allocateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');


function escapeHtml(str) {
  return (str + "").replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// Room type row
function makeRoomTypeRow(htIndex, rtIndex) {
  const row = document.createElement('div');
  row.className = 'room-type-row';
  row.innerHTML = `
    <div>${rtIndex + 1}</div>
    <input type="number" min="0" placeholder="No. of rooms" />
    <input type="number" min="0" placeholder="Persons/room" />
    <input type="text" placeholder="Total" disabled />
  `;

  const [label, roomsInput, pprInput, totalInput] = row.querySelectorAll('div,input');

  function updateTotal() {
    const rooms = parseInt(roomsInput.value || '0', 10);
    const ppr = parseInt(pprInput.value || '0', 10);
    const total = rooms > 0 && ppr > 0 ? rooms * ppr : 0;
    totalInput.value = total > 0 ? total : '';
    updateGrandTotal();
  }

  roomsInput.addEventListener('input', updateTotal);
  pprInput.addEventListener('input', updateTotal);

  return row;
}

// Hostel block
function makeHostelRow(index, data = { name: '', types: 0 }) {
  const row = document.createElement('div');
  row.className = 'row card hostel-block';
  row.style.padding = '12px';
  row.style.border = '1px solid #ddd';
  row.style.marginBottom = '12px';

  row.innerHTML = `
    <div style="display:flex; gap:12px; align-items:end; margin-bottom:10px;">
      <div>
        <label>Hostel ${index + 1} Name</label>
        <input type="text" placeholder="e.g., Vaigai" value="${data.name}" />
      </div>
      <div>
        <label>No. of Room Types</label>
        <input type="number" min="0" placeholder="e.g., 3" value="${data.types}" />
      </div>
      <button class="genTypesBtn">Generate Types</button>
      <button class="remove" title="Remove hostel">×</button>
    </div>
    <div class="room-types"></div>
  `;

  const [nameInput, typesInput] = row.querySelectorAll('input');
  const genTypesBtn = row.querySelector('.genTypesBtn');
  const roomTypesContainer = row.querySelector('.room-types');

  genTypesBtn.addEventListener('click', () => {
    roomTypesContainer.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'room-type-header';
    header.innerHTML = `<div></div><div>No. of Rooms</div><div>Persons/Room</div><div>Total</div>`;
    roomTypesContainer.appendChild(header);

    const count = parseInt(typesInput.value || '0', 10);
    for (let i = 0; i < count; i++) {
      roomTypesContainer.appendChild(makeRoomTypeRow(index, i));
    }
    updateGrandTotal();
  });


  row.querySelector('.remove').addEventListener('click', () => {
    row.remove();
    renumberHostels();
    updateGrandTotal();
  });

  return row;
}

function renumberHostels() {
  [...hostelsWrap.querySelectorAll('.row.card')].forEach((row, i) => {
    const label = row.querySelector('label');
    if (label) label.innerText = `Hostel ${i + 1} Name`;
  });
}

function updateGrandTotal() {
  let grandTotal = 0;
  [...hostelsWrap.querySelectorAll('.row.card')].forEach(hostelRow => {
    const roomTypeRows = hostelRow.querySelectorAll('.room-type-row');
    roomTypeRows.forEach(rtRow => {
      const inputs = rtRow.querySelectorAll('input');
      const rooms = parseInt(inputs[0].value || '0', 10);
      const ppr = parseInt(inputs[1].value || '0', 10);
      const totalInput = inputs[2];
      const total = rooms > 0 && ppr > 0 ? rooms * ppr : 0;
      totalInput.value = total > 0 ? total : '';
      grandTotal += total;
    });
  });

  let oldBox = document.getElementById('grandTotalBox');
  if (oldBox) oldBox.remove();

  const row = document.createElement('div');
  row.id = 'grandTotalBox';
  row.innerHTML = `<strong>Grand Total Capacity: ${grandTotal}</strong>`;
  hostelsWrap.appendChild(row);
}

function generateHostelFields() {
  const count = Math.max(0, parseInt(hostelCountInput.value || '0', 10));
  const current = hostelsWrap.querySelectorAll('.row.card').length;

  if (count > current) {
    for (let i = current; i < count; i++) hostelsWrap.appendChild(makeHostelRow(i));
  } else if (count < current) {
    for (let i = current - 1; i >= count; i--) hostelsWrap.querySelectorAll('.row.card')[i].remove();
  }
  renumberHostels();
  updateGrandTotal();
}

genHostelsBtn.addEventListener('click', generateHostelFields);
generateHostelFields(); // init

clearBtn.addEventListener('click', () => {
  statusEl.innerHTML = '';
  document.getElementById('resultsTbody').innerHTML = '';
});

allocateBtn.addEventListener('click', () => {
  statusEl.innerHTML = '';

  const students = Math.max(0, parseInt(document.getElementById('studentCount').value || '0', 10));
  const hostels = [];

  [...hostelsWrap.querySelectorAll('.row.card')].forEach((hostelRow, hIndex) => {
    const nameInput = hostelRow.querySelector('input[type="text"]');
    const hostelName = (nameInput.value || '').trim() || `Hostel ${hIndex + 1}`;

    const roomTypeRows = hostelRow.querySelectorAll('.room-type-row');
    roomTypeRows.forEach((rtRow, rtIndex) => {
      const inputs = rtRow.querySelectorAll('input');
      const rooms = parseInt(inputs[0].value || '0', 10);
      const ppr = parseInt(inputs[1].value || '0', 10);
      if (rooms > 0 && ppr > 0) {
        hostels.push({ hostel: hostelName, type: `${rtIndex + 1}`, rooms, ppr });
      }
    });
  });

  const capacity = hostels.reduce((sum, h) => sum + h.rooms * h.ppr, 0);
  let studentList = Array.from({ length: students }, (_, i) => i + 1);

  // shuffle
  for (let i = studentList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studentList[i], studentList[j]] = [studentList[j], studentList[i]];
  }

  const rows = [];
  let idx = 0;
  for (const h of hostels) {
    for (let room = 1; room <= h.rooms && idx < studentList.length; room++) {
      for (let seat = 1; seat <= h.ppr && idx < studentList.length; seat++) {
        rows.push({ student: studentList[idx], hostel: h.hostel, type: h.type, room, seat });
        idx++;
      }
    }
  }

  const unallocated = Math.max(0, students - rows.length);
  let msg = '';
  if (students === 0) msg = '<div>No students to allocate.</div>';
  else if (unallocated > 0) msg = `<div>Unallocated students count = <b>${unallocated}</b>. Capacity = ${capacity}, Students = ${students}</div>`;
  else msg = `<div>All students allocated. Capacity = ${capacity}</div>`;
  statusEl.innerHTML = msg;

  let tbody = document.getElementById('resultsTbody');
  tbody.innerHTML = '';

  let colorToggle = true;
  let lastRoomKey = null;
 rows.forEach(r => {
  const tr = document.createElement('tr');
  const roomKey = `${r.hostel}-${r.type}-${r.room}`;
  if (roomKey !== lastRoomKey) {
    colorToggle = !colorToggle;
    lastRoomKey = roomKey;
  }
  tr.className = colorToggle ? 'room-color-1' : 'room-color-2';

  // 👇 Updated column order
  tr.innerHTML = `
    <td>${escapeHtml(r.hostel)}</td>
    <td>${r.student}</td>
    <td>${r.type}</td>
    <td>${r.room}</td>
    <td>${r.seat}</td>
  `;

  tbody.appendChild(tr);
});

});
