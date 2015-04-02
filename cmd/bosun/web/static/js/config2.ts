interface IConfig2Scope extends ng.IScope {
	config_text: string;
	items: { [type: string]: string[]; };
	scrollTo: (type:string,name:string) => void;
	aceLoaded: (editor:any) => void
}



bosunControllers.controller('Config2Ctrl', ['$scope', '$http', '$location', '$route', function($scope: IConfig2Scope, $http: ng.IHttpService, $location: ng.ILocationService, $route: ng.route.IRouteService) {
	var search = $location.search();
	var current = search.config_text;
	try {
		current = atob(current);
	}
	catch (e) {
		current = '';
	}
	if (!current) {
		var def = '';
		$http.get('/api/config')
			.success((data) => {
				def = data;
			})
			.finally(() => {
				$location.search('config_text', btoa(def));
			});
		return;
	}
	var editor;
	var parseItems = function(configText:string) : { [type: string]: string[]; }{
		var re = /^\s*(alert|template|notification|lookup|macro)\s+([\w\-\.\$]+)\s*\{/gm; 
		var match;
		var items : { [type: string]: string[]; } = {};
		while (match = re.exec(configText)) {
        		var type = match[1];
			var name = match[2];
			var list = items[type];
			if (!list){
				list = [];
				items[type] = list;
			}
			list.push(name)
    		}
		return items
	}
	
	
	$scope.aceLoaded = function(_editor){
		editor = _editor;
		editor.getSession().setUseWrapMode(true);
		editor.on("blur", function(){
			$scope.$apply(function () {
            		$scope.items = parseItems($scope.config_text);
        		});
			
		});
	};
	$scope.config_text = current;
	$scope.items = parseItems(current);
	$scope.scrollTo = function(type:string, name:string){
		var searchRegex = new RegExp("^\\s*"+type+"\\s+"+name+"\\s*\\{", "gm");
		editor.find(searchRegex,{
    			backwards: false,
    			wrap: true,
    			caseSensitive: false,
    			wholeWord: false,
    			regExp: true,
		});
	}
	
	return $scope;
}]);