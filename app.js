const baseURL = 'https://datastudio.google.com/embed/reporting/87c26c67-28ae-45c3-aaa4-f864248ebb4f/page/p_im617hlswc'

const SUPABASE_URL = "https://ojfpzzbgxyrtwmqolqwa.supabase.co"
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZnB6emJneHlydHdtcW9scXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTc1MTU2OTMsImV4cCI6MTk3MzA5MTY5M30.Cw-t8RhhDHs0vKA6Q-zpQRL5JrX9vMX5g9oThszCEC4'
const { createClient } = supabase
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);



async function init_spbs(){
	var curr = current_access()
	const { user, error } = supabase.auth.setAuth(current_access())
	return supabase.auth.user()
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
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

