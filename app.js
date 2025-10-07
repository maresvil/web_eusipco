// app.js
// Explorador de papers biomédicos – EUSIPCO 2025

(() => {
  // Datos provistos por papers.js como window.papers
  const src = Array.isArray(window.papers) ? window.papers : [];
  const papers = src.slice();

  // Filtros visibles (sesión eliminado)
  const filterDefs = {
    signals: 'Señal fisiológica',
    medical_imaging: 'Imagen médica',
    uses_dl: '¿Usa Deep Learning?',
    dl_type: 'Tipo de DL',
    task: 'Tarea',
    context: 'Contexto'
  };

  const $ = (id) => document.getElementById(id);
  const filtersContainer = $('filters');
  const searchInput = $('search');
  const resultCount = $('result-count');
  const papersContainer = $('papers-container');

  // ---------- Construcción de filtros dinámicos ----------
  const selects = {};
  Object.keys(filterDefs).forEach((key) => {
    const group = document.createElement('div');
    group.className = 'filter-group';

    const label = document.createElement('label');
    label.textContent = filterDefs[key];

    const select = document.createElement('select');
    select.multiple = true;
    select.size = 5;

    // Opciones únicas
    getUniqueValues(papers, key).forEach((val) => {
      const option = document.createElement('option');
      option.value = String(val);
      option.textContent = String(val);
      select.appendChild(option);
    });

    // Botón limpiar este filtro
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-btn';
    clearBtn.textContent = 'Quitar';
    clearBtn.addEventListener('click', () => {
      Array.from(select.options).forEach((o) => (o.selected = false));
      applyFilters();
    });

    group.appendChild(label);
    group.appendChild(select);
    group.appendChild(clearBtn);
    filtersContainer.appendChild(group);
    selects[key] = select;
  });

  // Barra de acciones: limpiar todo
  const actions = document.createElement('div');
  actions.className = 'actions';
  const clearAll = document.createElement('button');
  clearAll.type = 'button';
  clearAll.id = 'clear-all';
  clearAll.textContent = 'Limpiar filtros';
  clearAll.addEventListener('click', () => {
    searchInput.value = '';
    Object.values(selects).forEach((sel) =>
      Array.from(sel.options).forEach((o) => (o.selected = false))
    );
    applyFilters();
  });
  filtersContainer.prepend(actions);
  actions.appendChild(clearAll);

  // Eventos
  searchInput.addEventListener('input', applyFilters);
  Object.values(selects).forEach((sel) => sel.addEventListener('change', applyFilters));

  // Inicial
  applyFilters();

  // ---------- Utilidades ----------
  function getUniqueValues(items, field) {
    const set = new Set();
    items.forEach((item) => {
      const value = item[field];
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== null && v !== undefined) set.add(String(v));
        });
      } else if (value !== null && value !== undefined) {
        set.add(String(value));
      }
    });
    return Array.from(set).sort();
  }

  // ---------- Lógica de filtrado y render ----------
  function applyFilters() {
    const term = searchInput.value.toLowerCase().trim();
    const active = {};
    Object.keys(selects).forEach((key) => {
      const selected = Array.from(selects[key].selectedOptions).map((o) => o.value);
      if (selected.length > 0) active[key] = selected;
    });

    const filtered = papers.filter((p) => {
      // Texto
      if (term) {
        const blob = (p.title + ' ' + (p.abstract_public || '')).toLowerCase();
        if (!blob.includes(term)) return false;
      }
      // Filtros
      for (const key of Object.keys(active)) {
        const sel = active[key];
        const value = p[key];
        if (Array.isArray(value)) {
          if (!value.map(String).some((v) => sel.includes(v))) return false;
        } else {
          const v = String(value);
          if (!sel.includes(v)) return false;
        }
      }
      return true;
    });

    render(filtered);
  }

  function render(list) {
    papersContainer.innerHTML = '';
    resultCount.textContent = `${list.length} resultado(s)`;

    list.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'paper-card';

      const title = document.createElement('h3');
      title.textContent = p.title;
      card.appendChild(title);

      const tags = document.createElement('div');
      tags.className = 'tags';
      ['signals', 'medical_imaging', 'dl_type', 'task', 'context'].forEach((f) => {
        (Array.isArray(p[f]) ? p[f] : [p[f]]).filter(Boolean).forEach((t) => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = String(t);
          tags.appendChild(span);
        });
      });
      card.appendChild(tags);

      const abs = document.createElement('p');
      abs.textContent = p.abstract_public || '';
      card.appendChild(abs);

      if (p.pdf_url) {
        const a = document.createElement('a');
        a.href = p.pdf_url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Ver PDF';
        card.appendChild(a);
      }

      papersContainer.appendChild(card);
    });
  }
})();
