const STEPS = 7;
let currentStep = 0;
let ultimoResultado = null;

const $ = (id) => document.getElementById(id);
const moneyIds = [
  'salarioBruto','segundoPagador','ssocial','paro','pension','autonomo','reta','modulos','dividendos','gananciasCapital','perdidasCapital','premios',
  'hipotecaPagado','alquilerPagado','alquilerIngreso','alquilerGastos','valorCatastral','planPension','planEmpresa','sindicatos','defensa','donaciones','partidosPoliticos','guarderia',
  'canGastoEnfermedad','canAyudaEnfermedad','canCustodia','canEmpleadaHogar','canTrasladoManual','canEco','canPatrimonio','canCultura','canESAL','canBIC','canEstudiosSup','canEstudiosNoSup',
  'canAcciones','canMayorDisc','canAcogimiento','canEnergetica','canAdecuacionDiscap','canDacion','canAdecuacionAlquiler','canSeguroImpago','canMercadoAlquiler','canDesempleado','canFamDisc',
  'retencionNomina','retencionAutonomo','pagosFraccionados','retencionCapital','retencionPension','retencionAlquiler'
];

function fmt(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));
}
function num(id) {
  return parseFloat($(id)?.value) || 0;
}
function val(id) {
  return $(id)?.value || '';
}
function radio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function updateProgress() {
  $('progressCurrent').textContent = String(currentStep + 1);
  $('progressFill').style.width = `${((currentStep + 1) / STEPS) * 100}%`;
  document.querySelectorAll('.step').forEach((el, i) => el.classList.toggle('active', i === currentStep));
  document.querySelectorAll('.nav-link').forEach((el, i) => el.classList.toggle('active', i === currentStep));
}
function goTo(step) {
  currentStep = clamp(step, 0, STEPS - 1);
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => goTo(Number(btn.dataset.step)));
});

function baseAhorroCuota(base) {
  let cuota = 0;
  let resto = Math.max(0, base);
  const tramos = [
    [6000, 0.19],
    [50000, 0.21],
    [200000, 0.23],
    [300000, 0.27],
    [Infinity, 0.28]
  ];
  let prev = 0;
  for (const [hasta, tipo] of tramos) {
    if (resto <= 0) break;
    const tramo = Math.min(resto, hasta - prev);
    cuota += tramo * tipo;
    resto -= tramo;
    prev = hasta;
  }
  return cuota;
}

function baseGeneralCuota(base) {
  let cuota = 0;
  let resto = Math.max(0, base);
  const tramos = [
    [12450, 0.19],
    [20200, 0.24],
    [35200, 0.30],
    [60000, 0.37],
    [300000, 0.45],
    [Infinity, 0.47]
  ];
  let prev = 0;
  for (const [hasta, tipo] of tramos) {
    if (resto <= 0) break;
    const tramo = Math.min(resto, hasta - prev);
    cuota += tramo * tipo;
    resto -= tramo;
    prev = hasta;
  }
  return cuota;
}

function reduccionTrabajo(rendimientoNetoPrevio, otrasRentas) {
  if (rendimientoNetoPrevio <= 0 || rendimientoNetoPrevio >= 19747.5 || otrasRentas > 6500) return 0;
  if (rendimientoNetoPrevio <= 14852) return 7302;
  if (rendimientoNetoPrevio <= 17673.52) return 7302 - (1.75 * (rendimientoNetoPrevio - 14852));
  return Math.max(0, 2364.34 - (1.14 * (rendimientoNetoPrevio - 17673.52)));
}

function minimoPersonalFamiliar({ edad, discapacidad, hijos, hijosMenores3, ascendientes }) {
  let total = 5550;
  if (edad >= 65) total += 1150;
  if (edad >= 75) total += 1400;
  if (discapacidad === 1) total += 3000;
  if (discapacidad === 2) total += 9000;
  const hijosBase = [2400, 2700, 4000, 4500];
  for (let i = 0; i < hijos; i++) total += hijosBase[Math.min(i, 3)];
  total += hijosMenores3 * 2800;
  total += ascendientes * 1150;
  return total;
}

function deduccionDonaciones(importe, recurrente) {
  if (importe <= 0) return 0;
  const primeros250 = Math.min(250, importe) * 0.8;
  const resto = Math.max(0, importe - 250) * (recurrente ? 0.45 : 0.40);
  return primeros250 + resto;
}

function diagnosticoObligacion({ trabajoIntegro, segundoPagador, autonomo, modulos, ahorro }) {
  const limiteTrabajo = segundoPagador > 1500 ? 15876 : 22000;
  if (autonomo > 0 || modulos > 0) {
    return {
      obligado: true,
      tone: 'danger',
      title: 'Obligado a declarar',
      text: 'Tienes actividad económica. Con eso, lo prudente es contar con obligación de presentar declaración.'
    };
  }
  if (trabajoIntegro > limiteTrabajo) {
    return {
      obligado: true,
      tone: 'danger',
      title: 'Obligado a declarar',
      text: `Tus rendimientos del trabajo superan el umbral estimado de ${fmt(limiteTrabajo)}.`
    };
  }
  if (ahorro > 1600) {
    return {
      obligado: true,
      tone: 'warn',
      title: 'Revisión necesaria',
      text: 'La renta del ahorro puede activar obligación o hacer aconsejable presentar. Revísalo con datos fiscales reales.'
    };
  }
  return {
    obligado: false,
    tone: 'ok',
    title: 'Podrías no estar obligado',
    text: 'Con esta foto rápida no parece clara la obligación de declarar, pero aun así conviene revisar si sale a devolver.'
  };
}

function validate() {
  if (num('hijosMenores3') > num('hijos')) {
    alert('Los hijos menores de 3 años no pueden superar al total de hijos.');
    return false;
  }
  return true;
}

function calcularCanarias(ctx) {
  const baseSuma = ctx.baseGeneral + ctx.baseAhorro;
  const individual = ctx.tributacion === 'individual';
  const limiteBI = individual ? 46455 : 61770;

  const alquilerElegible = ctx.comunidad === 'canarias' && radio('alqVive') === 'si' && num('alquilerPagado') > 0;
  const alquilerBase = Math.max(0, num('alquilerPagado'));
  let canAlquiler = 0;
  if (alquilerElegible && baseSuma <= limiteBI && alquilerBase > (baseSuma * 0.10)) {
    const maximo = (ctx.edad < 40 || ctx.edad >= 75) ? 760 : 740;
    canAlquiler = Math.min(alquilerBase * 0.24, maximo);
  }

  const enfermedadBase = Math.max(0, num('canGastoEnfermedad') - num('canAyudaEnfermedad'));
  let canEnfermedad = 0;
  if (ctx.comunidad === 'canarias' && enfermedadBase > 0) {
    const bruto = enfermedadBase * 0.12;
    if (baseSuma <= limiteBI) {
      let limite = individual ? 500 : 700;
      if (individual && (val('canExtraEnfermedad') === 'si')) limite += 100;
      canEnfermedad = Math.min(bruto, limite);
    } else {
      canEnfermedad = Math.min(bruto, 150);
    }
  }

  let canFamiliaNumerosa = 0;
  if (ctx.comunidad === 'canarias' && ctx.familiaNumerosa > 0) {
    const discapacidadEspecial = ctx.discapacidad === 2;
    if (ctx.familiaNumerosa === 1) canFamiliaNumerosa = discapacidadEspecial ? 1326 : 597;
    if (ctx.familiaNumerosa === 2) canFamiliaNumerosa = discapacidadEspecial ? 1459 : 796;
  }

  let canMonoparental = 0;
  if (ctx.comunidad === 'canarias' && val('monoparental') === 'si' && baseSuma <= limiteBI) {
    canMonoparental = 133;
  }

  let canNacimiento = 0;
  if (ctx.comunidad === 'canarias' && baseSuma <= limiteBI) {
    const hijosPrevios = ctx.hijos - num('nacimientos2025');
    for (let i = 1; i <= num('nacimientos2025'); i++) {
      const orden = hijosPrevios + i;
      if (orden <= 2) canNacimiento += 265;
      else if (orden === 3) canNacimiento += 530;
      else if (orden === 4) canNacimiento += 796;
      else canNacimiento += 928;
    }
  }

  let canGuarderia = 0;
  if (ctx.comunidad === 'canarias') {
    canGuarderia = Math.min(num('canCustodia') * 0.15, 400);
  }

  let canEmpleadaHogar = 0;
  if (ctx.comunidad === 'canarias') {
    canEmpleadaHogar = Math.min(num('canEmpleadaHogar') * 0.20, 500);
  }

  let canInversionVivienda = 0;
  if (ctx.comunidad === 'canarias' && radio('hipoteca') === 'si' && num('hipotecaPagado') > 0) {
    const tipo = ctx.edad <= 40 ? 0.055 : 0.05;
    canInversionVivienda = Math.min(num('hipotecaPagado') * tipo, 0.15 * ctx.cuotaAutonomicaOrientativa);
  }

  const manualIds = [
    'canEco','canPatrimonio','canCultura','canESAL','canBIC','canEstudiosSup','canEstudiosNoSup','canAcciones','canMayorDisc','canAcogimiento',
    'canEnergetica','canAdecuacionDiscap','canDacion','canAdecuacionAlquiler','canSeguroImpago','canMercadoAlquiler','canDesempleado','canFamDisc','canTrasladoManual'
  ];
  const manual = manualIds.reduce((acc, id) => acc + num(id), 0);

  return {
    canAlquiler,
    canEnfermedad,
    canFamiliaNumerosa,
    canMonoparental,
    canNacimiento,
    canGuarderia,
    canEmpleadaHogar,
    canInversionVivienda,
    manual,
    total: canAlquiler + canEnfermedad + canFamiliaNumerosa + canMonoparental + canNacimiento + canGuarderia + canEmpleadaHogar + canInversionVivienda + manual
  };
}

function calcular() {
  if (!validate()) return;

  const edad = num('edad') || 35;
  const tributacion = radio('tributacion');
  const discapacidad = Number(val('discapacidad') || 0);
  const comunidad = val('comunidad');
  const hijos = num('hijos');
  const hijosMenores3 = num('hijosMenores3');
  const ascendientes = num('ascendientes');
  const familiaNumerosa = Number(val('familiaNumerosa') || 0);

  const rendTrabajoIntegro = num('salarioBruto') + num('paro') + num('pension');
  const gastosTrabajo = num('ssocial') + 2000 + num('sindicatos') + Math.min(num('defensa'), 300);
  const rendimientoTrabajoPrevio = Math.max(0, rendTrabajoIntegro - gastosTrabajo);

  const rendimientoAutonomo = Math.max(0, num('autonomo') - num('reta'));
  const rendimientoModulos = num('modulos');
  const ahorro = Math.max(0, num('dividendos')) + Math.max(0, num('gananciasCapital') - num('perdidasCapital'));

  const rendimientoAlquilerPrevio = num('alquilerIngreso') - num('alquilerGastos');
  const reduccionArrendador = (val('alquilerResidencial') === 'si' && rendimientoAlquilerPrevio > 0) ? rendimientoAlquilerPrevio * 0.50 : 0;
  const rendimientoAlquilerNeto = rendimientoAlquilerPrevio - reduccionArrendador;
  const imputacionInmobiliaria = num('valorCatastral') * 0.011;

  const otrasRentas = Math.max(0, rendimientoAutonomo + rendimientoModulos + rendimientoAlquilerNeto + imputacionInmobiliaria + ahorro);
  const reduTrabajo = reduccionTrabajo(rendimientoTrabajoPrevio, otrasRentas);
  const rendimientoTrabajoNeto = Math.max(0, rendimientoTrabajoPrevio - reduTrabajo);

  const reduccionesBase = Math.min(num('planPension'), 1500) + Math.min(num('planEmpresa'), 8500) + (tributacion === 'conjunta' ? 3400 : 0);
  const baseGeneral = Math.max(0, rendimientoTrabajoNeto + rendimientoAutonomo + rendimientoModulos + rendimientoAlquilerNeto + imputacionInmobiliaria - reduccionesBase);
  const baseAhorro = Math.max(0, ahorro);
  const minimo = minimoPersonalFamiliar({ edad, discapacidad, hijos, hijosMenores3, ascendientes });

  const cuotaGeneralIntegra = Math.max(0, baseGeneralCuota(baseGeneral) - baseGeneralCuota(minimo));
  const cuotaAhorro = baseAhorroCuota(baseAhorro);
  const cuotaIntegra = cuotaGeneralIntegra + cuotaAhorro;
  const cuotaAutonomicaOrientativa = cuotaGeneralIntegra / 2;

  const dedGeneral = {
    donaciones: deduccionDonaciones(num('donaciones'), val('donacionRecurrente') === 'si'),
    partidos: Math.min(num('partidosPoliticos'), 600) * 0.20,
    maternidad: clamp(num('mesesMaternidad'), 0, 36) * 100,
    guarderia: Math.min(num('guarderia'), 1000),
    hipoteca: radio('hipoteca') === 'si' ? Math.min(num('hipotecaPagado'), 9040) * 0.15 : 0,
    familiaNumerosaEstatal: familiaNumerosa === 1 ? 1200 : familiaNumerosa === 2 ? 2400 : 0,
  };

  const ctx = { comunidad, baseGeneral, baseAhorro, tributacion, edad, familiaNumerosa, hijos, cuotaAutonomicaOrientativa, discapacidad };
  const canarias = calcularCanarias(ctx);

  const totalDeducciones = Object.values(dedGeneral).reduce((a, b) => a + b, 0) + canarias.total;
  const cuotaLiquida = Math.max(0, cuotaIntegra - totalDeducciones);

  const totalRetenciones = num('retencionNomina') + num('retencionAutonomo') + num('pagosFraccionados') + num('retencionCapital') + num('retencionPension') + num('retencionAlquiler');
  const resultado = cuotaLiquida - totalRetenciones;

  const premiosEspeciales = Math.max(0, num('premios') - 40000) * 0.20;

  const obligacion = diagnosticoObligacion({
    trabajoIntegro: rendTrabajoIntegro,
    segundoPagador: num('segundoPagador'),
    autonomo: num('autonomo'),
    modulos: num('modulos'),
    ahorro: baseAhorro
  });

  ultimoResultado = {
    fecha: new Date().toISOString(),
    baseGeneral, baseAhorro, minimo, cuotaIntegra, totalDeducciones, cuotaLiquida, totalRetenciones, resultado,
    reduTrabajo, canarias, dedGeneral, obligacion, premiosEspeciales, tributacion, comunidad
  };

  render(ultimoResultado);
  goTo(6);
  localStorage.setItem('renta_v4_data', JSON.stringify(serializarFormulario()));
}

function render(res) {
  const hero = $('heroResult');
  const amount = $('resultadoImporte');
  const text = $('resultadoTexto');

  hero.classList.remove('pagar', 'devolver');
  if (res.resultado > 0) {
    hero.classList.add('pagar');
    amount.textContent = fmt(res.resultado);
    text.textContent = 'A ingresar según esta simulación orientativa.';
  } else if (res.resultado < 0) {
    hero.classList.add('devolver');
    amount.textContent = fmt(Math.abs(res.resultado));
    text.textContent = 'A devolver según esta simulación orientativa.';
  } else {
    amount.textContent = fmt(0);
    text.textContent = 'Cuota cero.';
  }

  $('resultGrid').innerHTML = [
    ['Base general', fmt(res.baseGeneral)],
    ['Base del ahorro', fmt(res.baseAhorro)],
    ['Mínimo personal/familiar', fmt(res.minimo)],
    ['Reducción trabajo', fmt(-res.reduTrabajo)],
    ['Deducciones totales', fmt(-res.totalDeducciones)],
    ['Retenciones', fmt(-res.totalRetenciones)],
    ['Canarias calculado', fmt(res.canarias.total)],
    ['Premios gravamen esp.', fmt(res.premiosEspeciales)]
  ].map(([k,v]) => `<div class="result-item"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');

  const rows = [
    ['Base general', res.baseGeneral],
    ['Base ahorro', res.baseAhorro],
    ['Cuota íntegra', res.cuotaIntegra],
    ['Donaciones', -res.dedGeneral.donaciones],
    ['Maternidad', -res.dedGeneral.maternidad],
    ['Guardería estatal', -res.dedGeneral.guarderia],
    ['Hipoteca transitoria', -res.dedGeneral.hipoteca],
    ['Familia numerosa estatal', -res.dedGeneral.familiaNumerosaEstatal],
    ['Canarias alquiler', -res.canarias.canAlquiler],
    ['Canarias enfermedad', -res.canarias.canEnfermedad],
    ['Canarias familia numerosa', -res.canarias.canFamiliaNumerosa],
    ['Canarias monoparental', -res.canarias.canMonoparental],
    ['Canarias nacimiento/adopción', -res.canarias.canNacimiento],
    ['Canarias guardería', -res.canarias.canGuarderia],
    ['Canarias empleada de hogar', -res.canarias.canEmpleadaHogar],
    ['Canarias inversión vivienda', -res.canarias.canInversionVivienda],
    ['Canarias manual revisable', -res.canarias.manual],
    ['Retenciones', -res.totalRetenciones],
    ['Resultado', res.resultado]
  ];

  $('detalleTabla').innerHTML = `
    <thead><tr><th>Concepto</th><th>Importe</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1])}</td></tr>`).join('')}</tbody>
  `;

  const consejos = [];
  if (!res.obligacion.obligado) {
    consejos.push(['No te confíes', 'Aunque el simulador no vea obligación clara, si te sale a devolver suele convenir presentar igualmente.']);
  } else {
    consejos.push(['Presentación probable', res.obligacion.text]);
  }
  if (num('planPension') < 1500) consejos.push(['Plan de pensiones', 'Todavía puedes revisar si aprovechaste todo el margen del plan individual.']);
  if (num('donaciones') === 0) consejos.push(['Donativos', 'Los primeros 250 € a entidades acogidas desgravan fuerte. Es de las pocas alegrías fiscales que quedan.']);
  if (val('comunidad') === 'canarias' && num('alquilerPagado') > 0) consejos.push(['Canarias alquiler', 'Para la deducción canaria de alquiler necesitas NIF del arrendador, referencia catastral y que el alquiler supere el 10% de la suma de bases.']);
  if (val('comunidad') === 'canarias' && num('canGastoEnfermedad') > 0) consejos.push(['Canarias enfermedad', 'Conserva facturas y medios de pago. Sin eso, Hacienda te puede tumbar la deducción con toda la tranquilidad del mundo.']);
  if (num('gananciasCapital') > 0 && num('perdidasCapital') === 0) consejos.push(['Compensación', 'Revisa si tienes minusvalías pendientes para compensar ganancias del ahorro.']);
  if (num('salarioBruto') > 0 && num('segundoPagador') > 1500) consejos.push(['Segundo pagador', 'Aquí es donde muchos pasan de confiarse a cabrearse. Revisa bien el umbral reducido de obligación.']);

  $('consejosContainer').innerHTML = consejos.map(([t, p]) => `<div class="tip"><h5>${t}</h5><p>${p}</p></div>`).join('');

  const box = $('obligacionBox');
  box.className = `status-box ${res.obligacion.tone}`;
  box.innerHTML = `<strong>${res.obligacion.title}</strong><br>${res.obligacion.text}`;

  $('miniMetrics').innerHTML = [
    ['Base general', fmt(res.baseGeneral)],
    ['Base ahorro', fmt(res.baseAhorro)],
    ['Canarias', fmt(res.canarias.total)],
    ['Resultado', fmt(res.resultado)]
  ].map(([k,v]) => `<div class="metric"><span>${k}</span><strong>${v}</strong></div>`).join('');
}

function serializarFormulario() {
  const data = {};
  document.querySelectorAll('input, select').forEach(el => {
    if (el.type === 'radio') {
      if (el.checked) data[el.name] = el.value;
    } else {
      data[el.id] = el.value;
    }
  });
  return data;
}

function cargarFormulario(data) {
  if (!data) return;
  Object.entries(data).forEach(([key, value]) => {
    const el = $(key);
    if (el) {
      el.value = value;
      return;
    }
    const radioEl = document.querySelector(`input[name="${key}"][value="${value}"]`);
    if (radioEl) radioEl.checked = true;
  });
}

function exportarJSON() {
  const payload = {
    formulario: serializarFormulario(),
    resultado: ultimoResultado
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `simulacion-renta-v4-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetForm() {
  document.getElementById('rentaForm').reset();
  moneyIds.forEach(id => { if ($(id)) $(id).value = '0'; });
  ['hijos','hijosMenores3','ascendientes','nacimientos2025','mesesMaternidad'].forEach(id => { if ($(id)) $(id).value = '0'; });
  $('edad').value = '';
  $('campoSegundoPagador').style.display = 'none';
  ultimoResultado = null;
  $('resultGrid').innerHTML = '';
  $('detalleTabla').innerHTML = '';
  $('consejosContainer').innerHTML = '';
  $('resultadoImporte').textContent = fmt(0);
  $('resultadoTexto').textContent = 'Pulsa “Calcular v4”.';
  $('heroResult').classList.remove('pagar', 'devolver');
  $('obligacionBox').className = 'status-box neutral';
  $('obligacionBox').textContent = 'Completa el formulario para estimar si estás obligado a declarar.';
  $('miniMetrics').innerHTML = '';
  localStorage.removeItem('renta_v4_data');
  goTo(0);
}

$('numPagadores').addEventListener('change', (e) => {
  $('campoSegundoPagador').style.display = e.target.value === '2' ? 'grid' : 'none';
});
$('btnCalcular').addEventListener('click', calcular);
$('btnExportar').addEventListener('click', exportarJSON);
$('btnImprimir').addEventListener('click', () => window.print());
$('btnReset').addEventListener('click', resetForm);

(function init() {
  moneyIds.forEach(id => { if ($(id) && !$(id).value) $(id).value = '0'; });
  $('campoSegundoPagador').style.display = 'none';
  const saved = localStorage.getItem('renta_v4_data');
  if (saved) {
    try { cargarFormulario(JSON.parse(saved)); } catch (_) {}
    $('campoSegundoPagador').style.display = $('numPagadores').value === '2' ? 'grid' : 'none';
  }
  updateProgress();
})();
