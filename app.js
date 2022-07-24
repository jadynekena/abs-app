const baseURL = 'https://datastudio.google.com/embed/reporting/87c26c67-28ae-45c3-aaa4-f864248ebb4f/page/'
var my_departments = user_data('liste_departements')
var myname =  user_data('nom')
var mymode = user_data('mode')
const SEPARATOR = ';'
var selected_departement = ''


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
		const all_chosen_dept = res.data.split(SEPARATOR)
		const new_dep = '<option value="" selected>Tous</option>' + all_chosen_dept.map(e => '<option value="'+e+'">'+e+'</option>')

		$('#current_dep').html(new_dep)
	}
}

async function filter_departements(ceci){

	const current_dep  = ceci.value

	selected_departement = await get_those_deptmts([current_dep])  //search ID of the department remotely
	selected_departement = selected_departement['id_departement'] || ''

	//update my_departments locally
	my_departments = current_dep
	$('#current_dep').text(current_dep)

	console.log({my_departments})
	eval(save_and_run(true))
}

function update_username_locally(){
	document.querySelector('#you').innerText = user_data('nom')
}

async function sub_levels(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	const {data, error} = await supabase_local.from('niveaux').select('*').order('tarif_mensuel')
	
	if(data){

		res  = data.map(e => '<option  '+((is_demo() && e['etiquette_niveau'] === 'FREE') ? ' selected="selected" ' : '')+
									'   value="'+e['id_niveau']+'">'+e['etiquette_niveau'] + '     |     '
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
				<input type="text" maxlength="15" value="`+user_data('nom')+`" name="nom" id="nom" placeholder="Nom (max 15 caractères)"  autocomplete="off">
			</div>`
}

async function account(firsttime){
	title = (firsttime ? welcome() : $('#account').html()) 
	content = '<p>'+(firsttime ? '<span class="ignore">👤</span> Commençons par votre identité.' : '<i class="fa-duotone fa-user"></i>Vos informations') +'</p>' 
	content += await user_details_inputs()
	next_steps = firsttime ? 'save_my_datas(false,"interests('+firsttime+')")' : save_and_run()
	btn_name = firsttime ? 'Suivant' : 'Enregistrer'
	show_popup(true,title,content,btn_name,!firsttime,firsttime,next_steps)

	$('#niveau')[0].value = user_niveau()
	on_event('input','#nom','disable_space(event)')
}

function disable_space(event){
    if(event.which === 32) return false;
}


function show_all(yes){
	Array.from( document.querySelectorAll('.nav, .whole-body') ).forEach(e => e.style.display = yes ? '' : 'none' )
}

async function set_clicks(){

	on_event('click','#logout','logout()')
	
	

	if(await is_demo()){
		const timedout = await is_timedout()
		console.log({timedout})
		if(timedout){
			on_event('click','body','timeout_demo(event,"Fermer,💡, 📴 Déconnexion")')	
		} else{
			default_clicks()
		}

	}else{
		default_clicks()
	}

}

async function is_timedout(){
	return !(await enough_credits())
}

function default_clicks(){
	console.log('default clicks...')
	on_event('click','#interests','interests(false)')

	on_event('click','#account','account(false)')
	on_event('click','#keywords','loading_feature(this.innerHTML)')
	on_event('click','#you','account(false)')
	on_event('click', '#download','download()')
	on_event('click','.top-tabs-container','hide_back_menu(this)')
	
	//sub tabs
	on_event('click','[for="sub-tab-1"]','assign_iframe_url(this,"kpi")')
	on_event('click','[for="sub-tab-2"]','assign_iframe_url(this,"raw_datas")')


}

function timeout_demo(ceci,list_to_ignore){
	text = event.target.innerText.trim()
	//console.log(text)
	if((!list_to_ignore.includes(text) && text !== '') || event.target.id === "download" ){
		show_popup(true,'<span class="urgent">❌ Demo expirée</span>',call_to_level_up(),'Fermer',false,false)	
	} 
	
}

async function download(){

	//say that we downloaded
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY)
	my_details = await get_my_details()
	my_details['requete_telechargement'] = 'dernieres_donnees_cet_user'
	var id_download = await supabase_local.from('telechargements').insert(my_details).match({id: id_download})

	//console.log({id_download})

	if(id_download &&  id_download.data && id_download.data[0] && id_download.data[0]['id']	){
		id_download = id_download.data[0]['id']	
	} else{
		id_download = who_is_connected() //random uuid
	}

	const all = await my_amazon_datas(supabase_local)
	if(all.error){
		show_popup(true,'❌ Erreur','<div class="noupdate">'+all.error.message+'</div>','Fermer',false,false)

	}else{
		const date_consultation = all.data.split('\n')[1].substring(1,11);
		download_locally(all.data, date_consultation + '_' + user_data('nom') + '_' + my_departments.replaceAll(SEPARATOR,'-'))

		my_details['taille_telechargement'] =  size_of_variable(all.data)

		await supabase_local.from('telechargements').update(my_details).match({id: id_download})

	}
}

function no_download(){
	show_popup(true,'Télécharger les données')
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

function loading_feature(title){
	return show_popup(true, title, 'Fonctionnalité en cours de construction, merci de votre patience <span class="ignore">🤞</span>', 'Valider', false, false)
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

async function get_those_deptmts(deptmts_array){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	const {data, error} = await supabase_local.from('liste_tout_departements').select('*').in('Departement',deptmts_array)

	var res = ""
	if(data && data[0]) res = data[0] 

	return res
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

async function all_credits(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	me = await who_is_connected() ; 
	to_send = {
		'id_user_value':me,
	}

	if(is_demo()) to_send['adresse_ip_str'] = await myIP();


	let res = await call_function('credits',to_send,true) //this is text "{remain:0, max:0, used:0}"

	return res
}

function get_element_from_fake_json(fake_json,prop_name){
	var res = ''
	var temp = fake_json.split(',').filter(e => e.includes(prop_name)).map(e => e.replace('{','').replace('}',''))
	if(temp){
		res = temp[0].split(':')[1]
	}

	return res
}

async function user_credits(){
	
	var res = await all_credits()
	var remain = get_element_from_fake_json(res,'remain')
	var max = get_element_from_fake_json(res,'max')
	var used = get_element_from_fake_json(res,'used')
	
	return {remain:Number(remain),max:Number(max),used:Number(used)}
}

function disclaimer_credits(firsttime,used,max,remain){

	return '<p>'+(firsttime ? 'Vous pourrez modifier ces valeurs jusqu\'à <strong id="nb_modifs">'+max+'</strong> fois plus tard.' :

			'' +

			`
			<progress style="width: 200px;" value="`+used+`" max="`+max+`"></progress><br/>
			<p>Vous avez utilisé <a><strong>`+used+`</strong>/<strong>`+max+`</strong></a> de vos crédits.</p>
			`)
		
			+ (used >= max ? call_to_level_up('Vous devez changer votre niveau abonnement pour modifier.','Passer au niveau supérieur', window.location.pathname,'set_user_pricing()') : '') 
			


			+'</p>'
}

function call_to_level_up(text_for_user, action_text, link_action, on_click_action){

	text_for_user = is_demo() ? 'Votre démo a expiré, merci de vous inscrire pour continuer.' : text_for_user
	action_text = is_demo() ? "S'inscrire gratuitement" : action_text
	link_action = is_demo() ? "/" : link_action
	on_click_action = is_demo() ? 'logout()' : on_click_action

	return '<div class="noupdate"><strong class="urgent">'+text_for_user+'</strong><br/><br/><a onclick="'+on_click_action+'" href="'+link_action+'" class="action">'+action_text+'</a></div>'
}

function save_and_run(dontsend_local_changes){
	if(dontsend_local_changes) return 'save_my_datas(true,"iframe_setup()",true)' 
	return  'save_my_datas(true,"iframe_setup()")' 
}

async function interests(firsttime){
	title = (firsttime ? welcome() : $('#interests').html()) 
	all_deptmts = await  choice_departments()
	const {used, max, remain} = await user_credits()	
	disclaimer = disclaimer_credits(firsttime,used,max,remain)
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
	$('select').get().map(e => e.value = e.getAttribute('default')) //default select values

	//no saving
	if(used >= max) $('.swal2-confirm').remove()
}

async function enough_credits(){	
	// if used = max ---> keep disabling confirm button
	const {used, max, remain} = await user_credits()
	if(used >= max) return false 

	return true
}

function always_disable(selector){
	if(!selector) selector = '.swal2-confirm'
	$(selector).remove()
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
	//console.log({selected_departement})
	return my_selection() || selected_departement || user_data('liste_departements')
}

function get_nb_maj_to_save(){
	return user_data('nb_maj') || 0
}

async function get_id_niveau_to_save(){
	return $('#niveau').val() || user_niveau()
}

async function save_my_datas(lets_show_all,callback, dontsend_local_changes){
	//console.log({dontsend_local_changes})

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

	if(dontsend_local_changes) delete my_datas['liste_departements']

	show_all(lets_show_all)

	
	if(user_details() && supabase){


		//check current credits
		//if max achieved : remove departments
		if(await enough_credits() === false){
			delete my_datas['liste_departements']
			//alert('Crédits insuffisants.')
		}  

		const { user, error } = await supabase.auth.update({ 
			data: my_datas
		})


	}else{

		window.localStorage.setItem('nom',myname)


		//check current credits
		//if max achieved : no change on departments
		if(await enough_credits()){
			window.localStorage.setItem('liste_departements',my_departments)
		}  

		window.localStorage.setItem('mode',mymode)

		
	}

	if(callback){
		eval(callback)	
	} 
	
	hist = await send_my_details(true)
	//console.log({hist})
	
	if(!dontsend_local_changes) update_html_view()
	
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

	//console.log({dptmts})
	//console.log({forcing})

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
		assign_iframe_url(null,visible_iframe_id,forcing)

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

	return $('iframe:visible')[0] ? $('iframe:visible')[0].id : 'no-frame-detected'
}

function assign_iframe_url(src_of_change,iframe_id,forcing){
	//console.log({src_of_change})
	if(src_of_change){
		$('label').removeClass('selected_sub_tab')
		$(src_of_change).addClass('selected_sub_tab')
	}

	loading(true)

	curr_iframe = document.getElementById(iframe_id)

	if(curr_iframe){
		final_url = curr_iframe.getAttribute('url')
	
		if(curr_iframe.src !== final_url || curr_iframe.src === "" || forcing){
			//console.log({'assigning for':iframe_id})
			curr_iframe.src = final_url	
		} else{
			//console.log('not assigning: ',final_url)
			loading(false)	
		}
	}

	
}

function hide_navbar_after_click_on_phone(){
	$('#nav-check')[0].checked = false
}

main()

