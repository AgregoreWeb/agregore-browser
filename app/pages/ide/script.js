let URLElement, editor;
function setup() {
	URLElement = document.getElementById('URL');
	editor = ace.edit('body');
	editor.setTheme('ace/theme/monokai');
	editor.setShowPrintMargin(false);
	editor.session.setTabSize(4);
	editor.session.setUseSoftTabs(false);
	editor.commands.addCommand({
		name: 'Load',
		bindKey: {win: 'Ctrl-E',  mac: 'Command-E'},
		exec: load,
		readOnly: true
	});
	editor.commands.addCommand({
		name: 'Save',
		bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
		exec: save,
		readOnly: true
	});
}
async function load() {
	if(URLElement.value.endsWith('html')) editor.session.setMode('ace/mode/html');
	else if(URLElement.value.endsWith('js')) editor.session.setMode('ace/mode/javascript');
	else if(URLElement.value.endsWith('css')) editor.session.setMode('ace/mode/css');
	else if(URLElement.value.endsWith('md')) editor.session.setMode('ace/mode/markdown');
	else editor.session.setMode('ace/mode/text');
	
	let response = await fetch(URLElement.value, {
		method: 'GET'
	});
	let body = await response.text();
	editor.setValue(body);
}
function save() {
	let body = editor.getValue();
	if(body === '') {
		let saveButton = document.getElementById('save');
		if(!confirm('Are you sure you want to save a blank page?')) return;
	}
	fetch(URLElement.value, {
		method: 'PUT',
		body: body
	});
}