const baseURL = 'https://datastudio.google.com/embed/reporting/87c26c67-28ae-45c3-aaa4-f864248ebb4f/page/'
var my_departments = user_data('liste_departements')
var myname =  user_data('nom')
var mymode = user_data('mode')
const SEPARATOR = ';'


async function init_spbs(){
	supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
	var curr = current_access_token_exists()
	const { user, error } = supabase.auth.setAuth(current_access_token_exists())

	return supabase.auth.user()
}

function exactly_three_dptmts(list_with_commas){
	return (list_with_commas.match(/,/g) || []).length === 2
}

function main(){
	apply_theme()
	show_logo()
	set_clicks()
	init_spbs()
	first_arrival_handler()

	document.querySelector('.nav-links').addEventListener('click', hide_navbar_after_click_on_phone)
}

function show_logo(){

	//only if not in iframe
	if(!inIframe()){
		document.querySelector('.logo').style.display = 'initial';
		document.querySelector('.logo').parentNode.href =  window.location.pathname
	}

}

function first_arrival_handler(){
	first_connection = myname.trim().length === 0

	if(first_connection){
		show_all(false)
		account(true)
	}else {
		update_html_view()
		iframe_setup()
	}
	
}

function update_html_view(){
	update_username_locally()
	show_my_departments()

}

async function show_my_departments(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	res = await supabase_local.rpc('dep_from_uid',{mylist: my_departments})
	if(res.data){
		document.querySelector('#titleinterest').innerHTML = "Vos départements d'intérêt"
		document.querySelector('#liste_dptmts').innerHTML = res.data.split(SEPARATOR).map(e => '<span onclick="interests(false)">'+e+'</span>').join('')
	}
}

function update_username_locally(){
	document.querySelector('#you').innerText = user_data('nom')
}

async function sub_levels(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	const {data, error} = await supabase_local.from('niveaux').select('*').order('tarif_mensuel')
	
	if(data){

		res  = data.map(e => '<option value="'+e['id_niveau']+'">'+e['etiquette_niveau'] + '     |     '
																  + e['intitule_niveau'] + '     |     '
																  + e['tarif_mensuel'] + ' € / mois' 

							+'</option>' ).join('')
	}else{
		res = ''
	}

	return res
}

async function user_details_inputs(){
	mymail = user_mail()
	enable_level = is_demo() ? ' disabled ' : ''
	return `<div class="user_details_inputs">
				<input type="email" value="`+mymail+`" disabled="" autocomplete="off">
				<select `+enable_level+` name="niveau" id="niveau">
					<option value="">Choisissez votre niveau d'abonnement</option>
					`+await sub_levels()+`
				</select>
				<input type="text" maxlength="25" value="`+user_data('nom')+`" name="nom" id="nom" placeholder="Nom"  autocomplete="off">
			</div>`
}

async function account(firsttime){
	title = (firsttime ? welcome() : 'Mon compte') 
	content = '<p>'+(firsttime ? '👤 Commençons par votre identité.' : '<i class="fa-duotone fa-user"></i>👤 Vos informations') +'</p>' 
	content += await user_details_inputs()
	next_steps = firsttime ? 'save_my_datas(false,"interests('+firsttime+')")' : save_and_run()
	btn_name = firsttime ? 'Suivant' : 'Enregistrer'
	show_popup(true,title,content,btn_name,!firsttime,firsttime,next_steps)

	$('#niveau')[0].value = user_data('id_niveau')	
	on_event('input','#nom','disable_space(event)')
}

function disable_space(event){
    if(event.which === 32) return false;
}


function show_all(yes){
	Array.from( document.querySelectorAll('.nav, .iframe_wrapper') ).forEach(e => e.style.display = yes ? '' : 'none' )
}

function set_clicks(){
	on_event('click','#interests','interests(false)')
	on_event('click','#account','account(false)')
	on_event('click','#you','account(false)')
	on_event('click','#logout','logout()')
	on_event('click','#keywords','loading_feature()')
	on_event('click','#light','toggle_light()')

	on_event('click','.top-tabs-container','hide_back_menu(this)')
	
	//sub tabs
	on_event('click','[for="sub-tab-1"]','assign_iframe_url("kpi")')
	on_event('click','[for="sub-tab-2"]','assign_iframe_url("raw_datas")')
}

async function toggle_light(){
	$('html').toggleClass('nuit')
	mydatas = await save_my_datas(true)
	//console.log({mydatas})
}

function apply_theme(){
	if(user_data('mode') && user_data('mode') === 'nuit') {
		document.querySelector('html').className = "nuit"
	}
}

function hide_back_menu(ceci){
	document.querySelector("#menu-check").checked = false;
	setTimeout(set_current_menu, 10)
}

function set_current_menu(){

	if(document.querySelector("#menu-check").checked === false){

		const checked_element_id = $('[name="main-group"]:checked')[0].id
		const current_label = $('label[for="'+checked_element_id+'"]')
		const next_label = current_label.text()
		
		$('label').removeClass('selected_tab')
		$(current_label).addClass('selected_tab')
		$('#user-menu').html(next_label)
		//$('.sub-tab-content h1:visible').text(next_label)


	}

}

function loading_feature(){
	return show_popup(true, 'Mes mots-clés', 'Fonctionnalité en cours de construction, merci de votre patience <span class="ignore">🤞</span>', 'Valider', false, false)
}

function my_selection(){
	return $('.one_select select:visible').get().map(e => e.value).join(SEPARATOR)
}

function selected_if_right_item(my_departments,dptmt,index_of_deptmt){
	return (my_departments && my_departments.split(SEPARATOR)[index_of_deptmt] === dptmt) ? 'selected' : ''
} 

function value_selected(index_of_deptmt){
	//get departement of the index
	return my_departments ? my_departments.split(SEPARATOR)[index_of_deptmt] : ""
}

async function choice_departments(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	const {data, error} = await supabase_local.from('liste_tout_departements').select('*')
	
	const opt = (data || []).map((e,i) => '<option value="'+e['id_departement']+'">'+e['Departement']+'</option>')
	return '<div class="select_container centered">' + new Array(3).fill(`<div class="one_select centered"><label for="listID">Département n°INDEX_DPTMT</label><select default="value_selected" id="listID">`+opt+`</select></div>`)
														  .map((e,i) => e.replaceAll('listID','departement'+i).replaceAll('INDEX_DPTMT',(i+1)).replaceAll('value_selected',value_selected(i))   )
														  .join(' ')
		  + '</div>'
}

function hand_shake(){
	return '<span class="ignore">👋</span>'
}

function welcome(){
	return 'Bienvenue sur Amazon Best Sellers ' + hand_shake()
}

async function number_of_available_edits(){
	res = await all_credits()
	return res['remain_credits']
}

async function all_credits(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	me = await who_is_connected() ; 
	to_send = {
		'id_user':me,
	}

	if(is_demo()) to_send['adresse_ip_str'] = await myIP();

	res = await supabase_local.rpc('user_credits',to_send);

	return res.data && res.data[0] ? res.data[0] : {}

}

async function disclaimer_credits(firsttime){
	var res = await all_credits()
	var remain = res['remain_credits']
	var max = res['max_credits']
	var used = res['used_credits']

	return '<p>'+(firsttime ? 'Vous pourrez modifier ces valeurs jusqu\'à <strong id="nb_modifs">'+max+'</strong> fois plus tard.' :

			''
			
			+
			'Nombre de modifications MAXIMAL: <strong>'+max+'</strong><br/>' +
			'Nombre de modifications utilisées: <strong>'+used+'</strong><br/>' +
			'Nombre de modifications restantes: <strong>'+remain+'</strong><br/>' 
			

			) +'</p>'
}

function save_and_run(){
	return  'save_my_datas(true,"iframe_setup()")' 
}

async function interests(firsttime){
	title = (firsttime ? welcome() : 'Mes intérêts') 
	all_deptmts = await  choice_departments()
	disclaimer = await disclaimer_credits(firsttime)
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
		fullscreen: firsttime
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

function get_nb_maj_to_save(){
	return user_data('nb_maj') || 0
}

async function get_id_niveau_to_save(){
	return $('#niveau').val() || user_niveau()
}

function get_light(){
	return $('html')[0].className === '' ? 'jour' : 'nuit'
}

async function save_my_datas(lets_show_all,callback){
	//console.log({callback})

	myname = get_name_to_save()
	my_departments = get_deptmts_to_save()
	mymode = get_light()
	nb_maj = get_nb_maj_to_save()
	id_niveau = await get_id_niveau_to_save()

	my_datas = {
		nom: myname,
		liste_departements: my_departments,
		mode: mymode,
		id_niveau: id_niveau
	} 

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
	
	hist = await send_my_details(true)
	//console.log({hist})
	update_html_view()
	return my_datas

}

function iframe_setup(){
	my_departments = user_data('liste_departements');
	myname = user_data('nom');
	set_iframe(my_departments,true)
}

function logo(){
	return inIframe() ? "" : `<img src="/final-logo.png" alt="Amazon Best Sellers" class="local-logo">`
}

async function show_popup(with_animation,title,html,btn_name,with_cancel,fullscreen,next_steps){
	hasAlertOpened = false;

	if (this.hasAlertOpened) {
		return;
	}

	return await Swal.fire({
		animation: with_animation,
		title: logo() +'<h1>' +  title + '</h1>',
		html: '<div class="wrapper">'+html+'</div>',
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
		allowEnterKey: true,
		focusConfirm: true
	}).then(function(result_swal){
		//console.log(result_swal)
		if(result_swal['isConfirmed'] && next_steps) eval(next_steps)
		
	})
}

function set_iframe(dptmts,forcing){

	const list_of_iframes_id = ['kpi','raw_datas']
	const pages_id = ['p_zjlh8301wc', 'p_im617hlswc']

	var index_id = 0
	for (const iframe_id of list_of_iframes_id) {
		var view = document.getElementById(iframe_id)
		var params = {}

		params['fresh_datas.departement1'] = dptmts.split(SEPARATOR)[0] || 'unknown'
		params['fresh_datas.departement2'] = dptmts.split(SEPARATOR)[1] || 'unknown'
		params['fresh_datas.departement3'] = dptmts.split(SEPARATOR)[2] || 'unknown'


		final_url = baseURL + pages_id[index_id] + '?params=' + encodeURIComponent(JSON.stringify(params))	 
		//console.log({final_url})
		view.setAttribute('url',final_url)

		index_id = index_id +1
	}

	setTimeout(function(){

		//update only visible frame
		const visible_iframe_id = current_visible_iframe_id()
		assign_iframe_url(visible_iframe_id,forcing)

		//unassign other iframes if forcing
		if(forcing){
			list_of_iframes_id.forEach(function(e){
				if(e !== visible_iframe_id){
					document.getElementById(e).src = ""	
				}
			})
		}


	}, 10)

	return true
}

function current_visible_iframe_id(){

	return $('iframe:visible')[0].id
}

function assign_iframe_url(iframe_id,forcing){
	loading(true)

	curr_iframe = document.getElementById(iframe_id)
	final_url = curr_iframe.getAttribute('url')

	if(curr_iframe.src !== final_url || curr_iframe.src === "" || forcing){
		console.log({'assigning for':iframe_id})
		curr_iframe.src = final_url	
	} else{
		//console.log('not assigning: ',final_url)
		loading(false)	
	}

	
}

function hide_navbar_after_click_on_phone(){
	$('#nav-check')[0].checked = false
}

main()

