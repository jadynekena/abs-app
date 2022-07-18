const baseURL = 'https://datastudio.google.com/embed/reporting/87c26c67-28ae-45c3-aaa4-f864248ebb4f/page/p_im617hlswc'
function who_is_connected(){
	me = JSON.parse(localStorage.getItem('supabase.auth.token'))['currentSession']['user']['id']

	return me || '77f8732a-3d1a-4625-989c-b41f22c84761'
}

function exactly_three_dptmts(list_with_commas){
	return (list_with_commas.match(/,/g) || []).length === 2
}

function main(){
	var my_departments = 'Animalerie,Bijoux,High-Tech'
	set_iframe(my_departments)
}

function set_iframe(my_departments){
	var view = document.getElementById('view')

	const dep1 = exactly_three_dptmts(my_departments) ?  my_departments.split(',')[0] : ''
	const dep2 = exactly_three_dptmts(my_departments) ?  my_departments.split(',')[1] : ''
	const dep3 = exactly_three_dptmts(my_departments) ?  my_departments.split(',')[2] : ''

	var params = {
	  "fresh_datas.dptmts": my_departments,
	  "fresh_datas.departement1": dep1,
	  'fresh_datas.departement2': dep2,
	  'fresh_datas.departement3': dep3,
	  'fresh_datas.mot_cle_produit': '',
	};

	view.src = baseURL + '?params=' + encodeURIComponent(JSON.stringify(params))	
}

main()
