// formHandler.js

document.addEventListener('DOMContentLoaded', () => {
    const clienteId = new URLSearchParams(window.location.search).get('clienteId');
    if (clienteId) {
        // Primero, obtén los datos del cliente
        fetch(`/getClientInfo?clienteId=${clienteId}`)
            .then(response => response.json())
            .then(data => {
                fillForm(data);
                // Luego, obtén los datos para los campos select
                return Promise.all([
                    fetch('/getCanales'),
                    fetch('/getTiposTercero'),
                    fetch('/getClaseIdentificaciones'),
                    fetch('/getRespFiscales'),
                    fetch('/getTipoPersonas'),
                    fetch('/getRegimenIVAs')
                ]);
            })
            .then(responses => Promise.all(responses.map(response => response.json())))
            .then(([canales, tiposTercero, claseIdentificaciones, respFiscales, tipoPersonas, regimenIVAs]) => {
                console.log(canales);
                
                populateSelect('canal', canales);
                populateSelect('tipoTercero', tiposTercero);
                populateSelect('claseIdentificacion', claseIdentificaciones);
                populateSelect('respFiscal', respFiscales);
                populateSelect('tipoPersona', tipoPersonas);
                populateSelect('regimenIVA', regimenIVAs);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
});

function fillForm(data) {
    console.log(data);
    
    document.getElementById('estado').value = data.Estado || '';
    document.getElementById('status').value = data.Situacion || '';
    document.getElementById('canal').value = data.Canal || '';
    document.getElementById('tipoTercero').value = data.Tipoter || '';
    document.getElementById('codigo').value = data.Codigo || '';
    document.getElementById('claseIdentificacion').value = data.Clase || '';
    document.getElementById('respFiscal').value = data.ResFiscal || '';
    document.getElementById('noIdentificacion').value = data.Identificacion || '';
    document.getElementById('expedidaEn').value = data.Expedicion || '';
    document.getElementById('tipoPersona').value = data.Tipopersona || '';
    document.getElementById('regimenIVA').value = data.Regimen || '';
    
    // Deshabilitar campos de formulario
    toggleFormFields(false);
}

function toggleFormFields(enable) {
    const fields = document.querySelectorAll('#formTerceros input, #formTerceros select');
    fields.forEach(field => {
        field.disabled = !enable;
    });
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = ''; // Limpiar opciones actuales
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        select.appendChild(opt);
    });
}

// Función para habilitar el modo de edición
document.getElementById('editButton').addEventListener('click', () => {
    toggleFormFields(true);
});
