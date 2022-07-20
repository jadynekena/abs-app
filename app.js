const baseURL = 'https://datastudio.google.com/embed/reporting/87c26c67-28ae-45c3-aaa4-f864248ebb4f/page/p_im617hlswc'

const SUPABASE_URL = "https://ojfpzzbgxyrtwmqolqwa.supabase.co"
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZnB6emJneHlydHdtcW9scXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTc1MTU2OTMsImV4cCI6MTk3MzA5MTY5M30.Cw-t8RhhDHs0vKA6Q-zpQRL5JrX9vMX5g9oThszCEC4'
const { createClient } = supabase
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
var my_departments = user_data('liste_departements');
var myname = user_data('nom')
const SEPARATOR = ';'


async function init_spbs(){
	var curr = current_access_token_exists()
	const { user, error } = supabase.auth.setAuth(current_access_token_exists())
	return supabase.auth.user()
}

async function init_spbs_demo(){
	supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
	return supabase
}

function exactly_three_dptmts(list_with_commas){
	return (list_with_commas.match(/,/g) || []).length === 2
}

function main(){

	set_clicks()
	init_spbs()
	first_arrival_handler()

	document.addEventListener('click', function(e){
		if(e.target.innerText.length > 0) loading(true)
		setTimeout(function(){
			loading(false)
		}, 500)
	})
}

function first_arrival_handler(){
	first_connection = myname.length === 0

	if(first_connection){
		show_all(false)
		account(true)
	}else {
		document.querySelector('#you').innerText = user_data('nom')
		iframe_setup()
	}
	
}

function user_details_inputs(){
	return `<div class="user_details_inputs">
				<input type="email" value="`+user_mail()+`" disabled="" autocomplete="off">
				<input type="text" value="`+user_data('nom')+`" name="nom" id="nom" placeholder="Nom"  autocomplete="off">
			</div>`
}

async function account(firsttime){
	title = (firsttime ? welcome() : 'Mon compte') 
	content = '<p>'+(firsttime ? '👤 Commençons par votre identité.' : '') +'</p>' 
	content += user_details_inputs()
	content = '<div class="wrapper">'+content+'</div>'
	next_steps = firsttime ? 'save_my_datas(false,"interests('+firsttime+')")' : save_and_run()
	btn_name = firsttime ? 'Suivant' : 'Enregistrer'
	show_popup(true,title,content,btn_name,false,true,next_steps)
}

function show_all(yes){
	Array.from( document.querySelectorAll('.nav, .iframe_wrapper') ).forEach(e => e.style.display = yes ? '' : 'none' )
}

function set_clicks(){
	on_event('click','#interests','interests(false)')
	on_event('click','#account','account(false)')
	on_event('click','#logout','logout()')
}

function my_selection(){
	return $('select:visible').get().map(e => e.value).join(SEPARATOR)
}

function selected_if_right_item(my_departments,dptmt,index_of_deptmt){
	return (my_departments && my_departments.split(SEPARATOR)[index_of_deptmt] === dptmt) ? 'selected' : ''
} 

function value_selected(index_of_deptmt){
	//get departement of the index
	return my_departments ? my_departments.split(SEPARATOR)[index_of_deptmt] : ""
}

async function choice_departments(){
	supabase = await init_spbs_demo()
	const {data, error} = await supabase.from('liste_tout_departements').select('*')
	supabase = await init_spbs()


	const opt = (data || []).map((e,i) => '<option value="'+e['id_departement']+'">'+e['Departement']+'</option>')
	return '<div class="select_container">' + new Array(3).fill(`<span class="one_select"><label for="listID">Département n°INDEX_DPTMT</label><select default="value_selected" id="listID">`+opt+`</select></span>`)
														  .map((e,i) => e.replaceAll('listID','departement'+i).replaceAll('INDEX_DPTMT',(i+1)).replaceAll('value_selected',value_selected(i))   )
														  .join(' ')
		  + '</div>'
}

function welcome(){
	return 'Bienvenue sur Amazon Best Sellers 👋'
}

function number_of_available_edits(){
	return 5
}

function save_and_run(){
	return  'save_my_datas(true,"iframe_setup()")' 
}

async function interests(firsttime){
	title = (firsttime ? welcome() : 'Mes intérêts') 
	all_deptmts = await  choice_departments()
	disclaimer = '<p>'+(firsttime ? 'Vous pourrez modifier ces valeurs jusqu\'à <strong id="nb_modifs">'+number_of_available_edits()+'</strong> fois plus tard.' : 'Nombre de modifications restantes: <strong id="nb_modifs">'+number_of_available_edits()+'</strong>')+'</p>'
	content = '<p>'+(firsttime ? 'Pour commencer, c' : 'C')+'hoisissez vos 3 départements d\'intérêt.</p>' + all_deptmts + disclaimer 
	next_steps = save_and_run()
	btn_name = firsttime ? 'Suivant' : 'Enregistrer'
	with_cancel = firsttime ? false : true

	opt = {
		firsttime: firsttime,
		title: title,
		all_deptmts: all_deptmts,
		content: content,
		next_steps: next_steps,
		btn_name: btn_name,
		with_cancel: with_cancel,
		fullscreen: true
	}
	change_or_create_popup_contents(opt)
	$('select').get().map(e => e.value = e.getAttribute('default'))

}

function change_or_create_popup_contents(opt){
	pop = document.querySelector('.swal2-popup')
	if(pop){

		pop.querySelector('#swal2-title').innerHTML = opt['title']
		pop.querySelector('#swal2-html-container').innerHTML = opt['content']
		pop.querySelector('button').innerHTML = opt['btn_name']

	}else{
		show_popup(!opt['firsttime'],opt['title'],opt['content'],opt['btn_name'],opt['with_cancel'],opt['fullscreen'],opt['next_steps'])
	}

}

function get_name_to_save(){
	return $('#nom').val() || user_data('nom')
}

function get_deptmts_to_save(){
	return my_selection() || user_data('liste_departements')
}

async function save_my_datas(lets_show_all,callback){
	//console.log({callback})

	myname = get_name_to_save()
	my_departments = get_deptmts_to_save()

	my_datas = {
		nom: myname,
		liste_departements: my_departments
	} 

	//console.log({my_datas})

	show_all(lets_show_all)

	
	if(user_details() && supabase){
		const { user, error } = await supabase.auth.update({ 
			data: my_datas
		})


	}else{

		//console.log({myname})
		window.localStorage.setItem('nom',myname)
		window.localStorage.setItem('liste_departements',my_departments)

		
	}

	if(callback){
		eval(callback)	
	} 
	

	//if demo -> tell it
	if(user_mail() === 'demo@amazonbestsellers.org'){
		send_my_IP()
		send_my_name()
	}



	return my_datas

}

function iframe_setup(){
	my_departments = user_data('liste_departements');
	myname = user_data('nom');
	set_iframe(my_departments)
}

function logo(){
	return `<img src="final-logo.png" alt="Amazon Best Sellers" style="width: 200px;display:block;">`
}

async function show_popup(with_animation,title,html,btn_name,with_cancel,fullscreen,next_steps){

	return await Swal.fire({
		animation: with_animation,
		title: logo() +'<h1>' +  title + '</h1>',
		html: html,
		focusConfirm: false,
		confirmButtonText:  btn_name,
		cancelButtonText:  'Annuler',
		confirmButtonColor: '#f70',
		cancelButtonColor: '#9f9f9f',
		customClass: fullscreen ? 'swal-wide' : '',
		allowOutsideClick: with_cancel,
		allowEscapeKey: with_cancel,
		showCloseButton: with_cancel,
		showCancelButton: with_cancel,
	}).then(function(result_swal){
		console.log(result_swal)
		if(result_swal['isConfirmed'] && next_steps) eval(next_steps)
		
	})
}

function set_iframe(dptmts){
	var view = document.getElementById('view')

	var params = {}

	params['fresh_datas.departement1'] = dptmts.split(SEPARATOR)[0]
	params['fresh_datas.departement2'] = dptmts.split(SEPARATOR)[1]
	params['fresh_datas.departement3'] = dptmts.split(SEPARATOR)[2]


	final_url = baseURL + '?params=' + encodeURIComponent(JSON.stringify(params))	 
	if(view.src !== final_url) view.src = final_url

	//console.log({final_url})
	return final_url
}

main()

