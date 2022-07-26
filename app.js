const baseURL = 'https://datastudio.google.com/embed/reporting/87c26c67-28ae-45c3-aaa4-f864248ebb4f/page/'
const MAX_STEPS = (inIframe() || is_demo()) ? 5 : 6



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
	handle_embed()
	show_logo()
	set_clicks()
	init_spbs()
	first_arrival_handler()

	document.querySelector('.nav-links').addEventListener('click', hide_navbar_after_click_on_phone)
	//visit(0)
}

function show_logo(){

	//only if not in iframe
	if(!inIframe()){
		document.querySelector('.logo').style.display = 'initial';
		document.querySelector('.logo').parentNode.href =  window.location.pathname
	}

}
function handle_embed(){
	if(inIframe()){


		if(!is_demo()){
			show_all(false)
			//if (confirm('ℹ️ Déconnecter votre compte pour être en mode démo ?\nCliquez sur Annuler pour maintenir votre session.')) logout(true)	
			show_popup(true,'Vous êtes en mode demo','ℹ️ Vous pouvez aller sur votre session directement via <a target="_blank" href="https://app.amazonbestsellers.org">app.amazonbestsellers.org</a>.', 'Fermer')
			
			show_all(true)
		} 
		
		//if mobile : add margin top
		//if(isMobileDevice()) $('body').css('margin-top', '56px')
	}


}

function isMobileDevice(){
	const ua = navigator.userAgent;
	return (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) 
}

function first_arrival_handler(){

	//no name required at the beginning of demo
	in_iframe_or_demo = (inIframe() || is_demo())

	first_connection = in_iframe_or_demo ? (my_departments.trim().length < 3) : (myname.trim().length === 0 || my_departments.trim().length < 3)
	if(in_iframe_or_demo) $('html').attr('embedded',true)

	if(first_connection){
		show_all(false)

		//normal
		if(!in_iframe_or_demo){
			account(true)	

		//embedded or demo mode
		}else{

			update_username_locally();
			interests(true)
		}
		
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
	document.querySelector('#you').innerText = user_data('nom') || 'Anonyme'
}

async function sub_levels(){
	const supabase_local = createClient(SUPABASE_URL, SUPABASE_KEY);
	const {data, error} = await supabase_local.from('niveaux').select('*').order('tarif_mensuel,tarif_final')
	
	if(data){

		res  = data.map(e => '<option  '+((is_demo() && e['etiquette_niveau'] === 'FREE') ? ' selected="selected" ' : '')+
									'   value="'+e['id_niveau']+'">'+e['etiquette_niveau'] + '     |     '
																  + e['intitule_niveau'] + '     |     '
																  + e['tarif_mensuel'] + ' € / mois'  + '     |     '
																  + e['nb_max_maj'] + ' crédits' 

							+'</option>' ).join('')
	}else{
		res = ''
	}

	return res
}

async function user_details_inputs(){
	mymail = user_mail()
	enable_level = is_demo() ? ' disabled ' : ''
	var info = is_demo() ? '' : '<i style="font-size: 11px;">Tous les niveaux sont actuellement gratuits.</i>'
	return `<div class="user_details_inputs">
				<input type="email" value="`+mymail+`" disabled="" autocomplete="off">
				<select chosen="" onchange="this.setAttribute('chosen',this.value); " `+enable_level+` name="niveau" id="niveau">
					<option value="">Choisissez votre niveau d'abonnement</option>
					`+await sub_levels()+`
				</select>
				`+info+`
				<input type="text" maxlength="15" value="`+user_data('nom')+`" name="nom" id="nom" placeholder="Nom (max 15 caractères)"  autocomplete="off">
			</div>`
}

async function account(firsttime){
	title = (firsttime ? welcome() : $('#account').html()) 
	content = '<p>'+(firsttime ? '<span class="ignore">👤</span> Commençons par votre identité.' : '<i class="fa-duotone fa-user"></i>Vos informations') +'</p>' 
	content += await user_details_inputs()
	content += !firsttime ? delete_acc() : ''
	next_steps = firsttime ? 'save_my_datas(false,"update_username_locally();interests('+firsttime+')")' : save_and_run()
	btn_name = firsttime ? 'Suivant' : 'Enregistrer'
	show_popup(true,title,content,btn_name,!firsttime,firsttime,next_steps)

	$('#niveau')[0].value = user_niveau()
	$('#niveau').change()
	on_event('input','#nom','disable_space(event)')

}

function delete_acc(blocked){
	if(!is_demo()) return `
	<div class="${blocked ? 'blocked' : ''}" style="margin-top: 20px;">
		<details ${blocked ? 'open=""' : ''} class="urgent" style="border-radius: 10px;background: #ff000036;cursor: pointer;font-size: 12px;padding: 5px;height: auto;"><summary>ZONE DE DANGER</summary>
			<a target="_blank" href="/?type=recovery"><span class="action" style="padding: 2px;margin: 10px auto;width: 100px;background-color: #00000073;">Changer de mot de passe</span></a>
	  		<span class="action" onclick="ask_del_acc()" style="padding: 2px;margin: 10px auto;width: 100px;">Supprimer mon compte</span>
  		</details>
	</div>
	`

	return ''
}

function newpass(){
	window.location.href = "/?type=recovery"
}

function random_code(length){
	var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

   return result;
}

async function ask_del_acc(){
	code = random_code(8)
	code_insert = prompt('⚠️ ATTENTION : cette action est irréversible, et TOUTES vos données seront immédiatement supprimées.\n\nPour supprimer votre compte DEFINITIVEMENT, merci de saisir le code suivant : '+code,'')
	if(code_insert) code_insert = code_insert.trim()
	if(code_insert === code){
		await supabase.rpc('delete_user')
		alert('✅ Votre compte a bien été supprimé.\nVous allez maintenant être déconnecté.')
		logout()
	}else if(code_insert.length > 0){
		alert('❌ Vous n\'avez pas saisi le bon code.')
	}
}

function disable_space(event){
    if(event.which === 32) return false;
}


async function set_clicks(){

	on_event('click','#logout','logout()')
	on_event('click','#feedback','feedback()')
	
	

	if(await is_demo()){
		const timedout = await is_timedout()
		//console.log({timedout})
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

function feedback(){
	show_popup(true,"Besoin d'aide ?",'<div>'+visit_btn() + contact()+'</div>','Valider',true,false,'send_feedback()' )
}

//first time
function visit_btn(){
	return `<span onclick="visit(0)"><a class="action ignore" id="visit">Visite guidée</a></span>`
}

//show_popup(with_animation, title, html, btn_name, with_cancel, fullscreen, next_steps)
function visit(number){

	

	//top always 0
	document.body.scrollTop = 0; // For Safari
  	document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

	const btn_name = visit_btn_name(number, MAX_STEPS)
	const next_step_number = number + 1
	const next_step_callback = 'visit('+next_step_number+')'
	const with_cancel = (number%MAX_STEPS === 0) ? false : true

	console.log({number},{MAX_STEPS})



	//show only if needed
	if(number <= MAX_STEPS){
		if(number>0) activate_visit_mode(true) //no body blur + no body darken + transparent popup 
		if(number === MAX_STEPS) activate_visit_mode(false)

		show_popup(!with_cancel,visit_title(number),visit_html(number),btn_name,with_cancel,false, next_step_callback,true)	

		//manual drag
		$('.swal2-popup').draggable();

		//highlight relevant elements 
		$('body *').removeClass('spot')
		spotselector = selector_spot(number)
		$(spotselector).addClass('spot')

		//downlight non relevant elements
		$('body *').removeClass('blocked')
		$('body *:not(.spot)').addClass('blocked')

		//popup position + node focus
		$('body *').removeClass('current_node')
		apply_popup_position(number)

		window.onresize = function(){
		  doit = setTimeout(function(){apply_popup_position(number)}, 100);
			
		};

		//optional function to call (todo) 
		if($('.current_node')[0]){
			if($('.current_node')[0].id === 'download'){
				$('#nav-check')[0].checked = true
			} else{
				$('#nav-check')[0].checked = false
			}					
		}



	}else{
		activate_visit_mode(false)
	}
}

function apply_popup_position(currentstep){
	if(currentstep === 0) return false
	if(!currentstep) currentstep = $('#currentstep').text()

	//console.log({currentstep})
	const nodes_near_me = selector_spot(currentstep).replace( default_spots() + ', ' , '').replace( default_spots(), '')

	//disable nodes near me
	$(nodes_near_me).addClass('current_node')
	//console.log({nodes_near_me})
	
	const pos = popup_xy(currentstep, nodes_near_me)
	$(".swal2-popup").animate({
		top:pos[0],
		left:pos[1]
	}, 200);
}


//use $('.swal2-popup')[0].offsetTop + ' ' + $('.swal2-popup')[0].offsetLeft
//use window.innerWidth + '        ' + $('.swal2-popup')[0].offsetLeft
function popup_xy(step, nodes_near_me){
		
	const p_width = $('.swal2-popup')[0].offsetWidth
	const p_height = $('.swal2-popup')[0].offsetHeight

	const vh = window.innerHeight
	const vw = window.innerWidth

	//default positions
	/*
	const top =  (window.innerHeight - p_height)/2
	const left = (window.innerWidth - p_width)/2
	*/

	if(step === MAX_STEPS) return [(window.innerHeight - p_height)/2, (window.innerWidth - p_width)/2]

	var top = step === 1 ? 567 : 
			step === 2 ? 251 : 
			step === 3 ? 128 : 
			step === 4 ? 74 : 
			step === 5 ? 60 : 
			(vh - p_height)/2
 
 	//if PORTRAIT : use this :

	//todo : refaire left = width - right  ----> right =  width - left  ---> RAPPORT DE RIGHT AVEC VW
	if(portrait()){

		var left = step === 1 ? (0.41*vw) : //1307      775     ---> right = 532   ---> 41%
			step === 2 ? (0.68*vw) : //1307        414 ---> right = 893 ---> 68%
			step === 3 ? (0.56*vw) : //1307        570 ---> right = 737 ---> 54%
			step === 4 ? (0.92*vw) :  //1307        67 ---> right = 1238 --->  92%
			step === 5 ? (0.49*vw) : //1307        664  ---> right = 643 ---> 49%
			(vw - p_width)/2  

	//if NOT PORTRAIT, use this :
	}else{

		var left = step === 1 ? (775) : //1307      775     ---> right = 532   ---> 41%
			step === 2 ? (vw-893) : //1307        414 ---> right = 893 ---> 68%
			step === 3 ? (vw-737) : //1307        570 ---> right = 737 ---> 54%
			step === 4 ? (vw-1241) :  //1307        67 ---> right = 1241 --->  95%
			step === 5 ? (vw-643) : //1307        664  ---> right = 643 ---> 49%
			(vw - p_width)/2  
	}
	

	//top : min = 0, max = (1vh - popup height)
	if(top < 0) top = 0
	if(top > (vh - p_height) ) top = (vh - p_height)

	//left : min = 0, max = (1w - popup width - 50)
	if(left < 0) left = 0
	if(left > (vw - p_width - 50) ) left = (vw - p_width - 50)


	//console.log({top},{left})
	res = [top,left]
	return res;
}

function default_spots(){
	return 'body, .swal2-container, .swal2-container * '
}

function selector_spot(step){
	res = default_spots()
	additional = step === 1 ? '#interests, #edit' :
		   step === 2 ? '.sub-tabs-container' :
		   step === 3 ? '#download' :
		   step === 4 ? '#you' :
		   step === 5 ? '#account' :
		   step === 6 ? '' :
		   ''
  	res = res + (additional ? ', ' + additional : '')
   return res 

}

function visit_btn_name(step){
	/*
	console.log('bouton : ')
	console.log({step})
	console.log({MAX_STEPS})
	*/
	return step === 0 ? 'Commencer' :
			step === MAX_STEPS ? 'Terminer' :
			'Suivant'
}

function visit_title(step){
	res = ''

	previous_step = step - 1
	if (previous_step > 0) res += '<span onclick="visit('+previous_step+')">← </span>'

	res += (step < MAX_STEPS) ? `<span>${step}/${MAX_STEPS-1}</span><br/>` : '<span class="ignore">☑️</span><br/>'

	//progress bar
	res += `<progress value="${step}" max="${MAX_STEPS-1}"></progress><div class="litle_title">`

	title_text = step === 0 ? 'Visite guidée' :
			step === MAX_STEPS ? 'Visite terminée' :
			step === 1 ? 'Edition des intérêts' :
			step === 2 ? 'Choix des données à afficher' :
			step === 3 ? 'Télécharger les données du jour' :
			step === 4 ? 'Modifier votre nom' :
			step === 5 ? 'Modifier votre mot de passe' :
			''

	res += '<span">' + title_text + '</span>'
	res += '</div>'


	

	return res
}

function visit_html(step){
	return step === 0 ? `Nous allons vous familiariser avec la plateforme en <strong>seulement ${MAX_STEPS-1} étapes</strong>.<br/>Vous pouvez revenir à ce tutoriel à tout moment.<br/>` :
		   step === MAX_STEPS ? 'Et voilà ! Vous savez maintenant utiliser la plateforme ABS.' :
		   step === 1 ? `La première étape consite à choisir vos 3 départements d'intérêts, qui seront modifiables plus tard grâce à cet icône. Vous avez le choix parmi <strong>une trentaine d'options</strong> !` :
		   step === 2 ? `Les onglets vous aident à choisir les données graphiques à afficher.` :
		   step === 3 ? `Le bouton <strong>Télécharger</strong> en haut à droite de l'écran vous permet de récupérer le fichier CSV du jour.<br/> Cette option n'est disponible que <strong>en mode connecté.</strong>` :
		   step === 4 ? phrase_nom() + ` Vous pouvez le modifier en cliquant directement dessus, ou en cliquant sur l'icône <span class="ignore">👤</span>.` :
		   step === 5 ? `Votre mot de passe peut être modifié en allant dans Mon compte → ZONE DE DANGER → Changer de mot de passe : <br/>` + delete_acc(true) :
		   ''
}

function phrase_nom(){
	if(is_demo() || user_data('nom') === 'Anonyme' || user_data('nom') === undefined || user_data('nom') === null){
		return 'Par défaut, si vous ne donnez pas un nom à votre compte, vous serez nommé <strong>Anonyme</strong>.'
	}else{
		return `Vous avez déjà configuré votre nom en <strong>${user_data('nom')}</strong>, et c\'est très bien !`
	}
}

function contact(){
	return `
		<details>
			<summary class="subtitle action ignore">Nous contacter</summary>
			<div class="contact">
				Si vous avez : ${items_fback()} merci de nous détailler votre demande.${feedback_input()}
			</div>
		</details>
	`
}

function items_fback(){
	return ' une question, une remarque, une suggestion, un feedback ou autre, '
}

function items_fback_old(){
	return `<ul style="text-align: justify;padding-left: 30px;margin: 15px;">
				<li>une question</li>
				<li>une remarque</li>
				<li>une suggestion</li>
				<li>un feedback</li>
				<li>etc.</li>
			</ul>
	`
}
function feedback_input(){
	return `<textarea id="myfeedback" maxlength="1000" placeholder="Votre demande..." class="textarea"></textarea>`
}

async function send_feedback(){
	if($('details[open]').length === 0) return false
	const supabase_local = createClient(SUPABASE_URL,SUPABASE_KEY)
	const myfeedback = $('#myfeedback').val().trim()

	if(!myfeedback) return alert('❌ Votre message est vide : impossible de l\'envoyer.')
	

	var feedback =  my_details
	feedback['contenu'] = myfeedback
	delete feedback['liste_departements']


	//console.log({feedback})

	await supabase_local.from('feedback').insert(feedback)
	alert('✅ Message reçu. Nous reviendrons vers vous dans les meilleurs délais.') //Un mail de confirmation vous a été envoyé.
}

function default_clicks(){
	//console.log('default clicks...')
	on_event('click','#interests, #edit','interests(false)')

	on_event('click','#account, #profile','account(false)')
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
		download_locally(all.data, date_consultation + '_' + user_data('nom') + '_AMAZONBESTSELLERS')

		my_details['taille_telechargement'] =  size_of_variable(all.data)

		await supabase_local.from('telechargements').update(my_details).match({id: id_download})
		show_popup(true,'✅ Téléchargement terminé','Votre fichier CSV du jour a été téléchargé avec succès.','Fermer')

	}
}

function no_download(){
	show_popup(true,'Télécharger les données')
}

function apply_theme(){
	if(user_data('mode') && user_data('mode') === 'nuit') {
		//document.querySelector('html').className = "nuit"
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
	return show_popup(true, title, 'Fonctionnalité en cours de construction, merci de votre patience <span class="ignore">🤞</span>', 'Fermer', false, false)
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
	return '<div class="select_container centered">' + new Array(3).fill(`<div class="one_select centered"><label for="listID">Département n°INDEX_DPTMT</label><select onchange="this.setAttribute('default', this.value)" default="value_selected" id="listID">`+opt+`</select></div>`)
														  .map((e,i) => e.replaceAll('listID','departement'+i).replaceAll('INDEX_DPTMT',(i+1)).replaceAll('value_selected',value_selected(i))   )
														  .join(' ')
		  + '</div>'
}

function hand_wave(){
	return '<span class="ignore">👋</span>'
}

function welcome(){
	return 'Bienvenue sur Amazon Best Sellers ' + hand_wave()
}

function disclaimer_credits(firsttime,used,max,remain){

	return '<p>'+(firsttime ? 'Vous pourrez modifier ces valeurs jusqu\'à <strong id="nb_modifs">'+max+'</strong> fois plus tard.' :

			'' +

			`
			<progress value="`+used+`" max="`+max+`"></progress><br/>
			<p>Vous avez utilisé <a><strong>`+used+`</strong>/<strong>`+max+`</strong></a> de vos crédits.</p>
			`)
		
			+ (used >= max ? call_to_level_up('Vous devez changer votre niveau abonnement pour modifier.','Passer au niveau supérieur', "",'account()') : '') 
			


			+'</p>'
}

function call_to_level_up(text_for_user, action_text, link_action_with_href, on_click_action){

	text_for_user = is_demo() ? 'Votre démo a expiré, merci de vous inscrire pour continuer.' : text_for_user
	action_text = is_demo() ? "S'inscrire gratuitement" : action_text
	link_action_with_href = is_demo() ? "href='/'" : link_action_with_href
	on_click_action = is_demo() ? 'logout()' : on_click_action

	return '<div class="noupdate"><strong class="urgent">'+text_for_user+'</strong><br/><br/><a onclick="'+on_click_action+'" '+link_action_with_href+' class="action">'+action_text+'</a></div>'
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
	btn_name = firsttime ? '<span class="ignore"> 🪄 </span> Voir les données' : 'Enregistrer'
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

function visit_right_after(firsttime){	
	//wait a little
	console.log('waiting a little...')
	if(firsttime) setTimeout(function(){visit(0)}, 2000)
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
		show_popup(!opt['firsttime'],opt['title'],opt['content'],opt['btn_name'],opt['with_cancel'],opt['fullscreen'],opt['next_steps']).then(() => visit_right_after(opt['firsttime']))
	}

}


function iframe_setup(){
	my_departments = user_data('liste_departements');
	myname = user_data('nom');
	set_iframe(my_departments,true)
}

function logo(){
	return inIframe() ? "" : `<img src="/final-logo.png" alt="Amazon Best Sellers" class="local-logo">`
}

async function show_popup(with_animation,title,html,btn_name,with_cancel,fullscreen,next_steps,no_escape_please,default_positions_x_y){
	hasAlertOpened = false;

	if (this.hasAlertOpened) {
		return;
	}
	//console.log({no_escape_please})
	const escapable = no_escape_please ? false : with_cancel
	//console.log({escapable})

	const opt = {
		animation: with_animation,
		title: logo() +'<h1 class="atitle">' +  title + '</h1>',
		html: '<div class="wrapper">'+html+'</div>',
		focusConfirm: false,
		confirmButtonText:  btn_name,
		cancelButtonText:  'Annuler',
		confirmButtonColor: '#f70',
		cancelButtonColor: '#9f9f9f',
		customClass: fullscreen ? 'swal-wide' : '',
		allowOutsideClick: escapable,
		allowEscapeKey: escapable,
		showCloseButton: escapable,
		showCancelButton: with_cancel,
		allowEnterKey: true,
		focusConfirm: true
	}

	if(!with_animation){
		  opt['showClass']= {
		    backdrop: 'swal2-noanimation', // disable backdrop animation
		    popup: '',                     // disable popup animation
		    icon: ''                       // disable icon animation
		  }
		  opt['hideClass'] = {
		    popup: '',                     // disable popup fade-out animation
		  }
	}

	return await Swal.fire(opt).then(function(result_swal){

		if(result_swal['isConfirmed'] && next_steps){
			eval(next_steps)	
		} else{
			activate_visit_mode(false)
		}
		
		
	})
}

function activate_visit_mode(yes){
	if(yes){
		$('body').attr('visit_mode',true)
	}else{
		$('body').removeAttr('visit_mode')
		$('body, body *').removeClass('current_node')
		$('body, body *').removeClass('spot').removeClass('blocked')
	}
}

function set_iframe(dptmts,forcing){

	loading(true)

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


	}, 200)

	return true
}

function current_visible_iframe_id(){
	return $('iframe:visible')[0] ? $('iframe:visible')[0].id : 'no-frame-detected'
}

function assign_iframe_url(src_of_change,iframe_id,forcing){
	//console.log({iframe_id})
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
			curr_iframe.src = final_url	
		} else{
			loading(false)	
		}
	}

	
}

function hide_navbar_after_click_on_phone(){
	$('#nav-check')[0].checked = false
}

main()

