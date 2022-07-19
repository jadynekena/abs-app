const baseURL = 'https://datastudio.google.com/embed/reporting/87c26c67-28ae-45c3-aaa4-f864248ebb4f/page/p_im617hlswc'


async function init_spbs(){

	//if(!current_access()) window.location.href = '/'


	const SUPABASE_URL = "https://ojfpzzbgxyrtwmqolqwa.supabase.co"
	const SUPABASE_KEY = current_access()

	try {

		const { createClient } = supabase	
		const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

		const { data, error } = await supabase
		  .from('dernieres_donnees')
		  .select('*')

		console.log({data})
		console.log({error})
	}catch(e){
		console.error(e)
	}
}


function who_is_connected(){
	me = JSON.parse(localStorage.getItem('supabase.auth.token'))['currentSession']['user']['id']

	return me || '77f8732a-3d1a-4625-989c-b41f22c84761'
}

function current_access(){
	return window.localStorage.getItem('supabase.auth.token') ? JSON.parse(window.localStorage.getItem('supabase.auth.token'))['currentSession']['access_token'] : false
}



function exactly_three_dptmts(list_with_commas){
	return (list_with_commas.match(/,/g) || []).length === 2
}

function main(){
	init_spbs()
	var my_departments = 'Animalerie,Informatique,Vêtements'
	set_iframe(my_departments)

}

function set_iframe(my_departments){
	var view = document.getElementById('view')

	var params = {}

	params["fresh_datas.dptmts"] = my_departments
	if( exactly_three_dptmts(my_departments) ){
		params['fresh_datas.departement1'] = my_departments.split(',')[0]
		params['fresh_datas.departement2'] = my_departments.split(',')[1]
		params['fresh_datas.departement3'] = my_departments.split(',')[2]
	} 

	final_url = baseURL + '?params=' + encodeURIComponent(JSON.stringify(params))	 
	view.src = final_url

	//console.log({final_url})
	return final_url
}

main()
