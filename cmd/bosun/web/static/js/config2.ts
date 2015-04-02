interface IConfig2Scope extends ng.IScope {
	// text loading/navigation
	config_text: string;
	selected_alert: string;
	items: { [type: string]: string[]; };
	scrollTo: (type:string,name:string) => void;
	aceLoaded: (editor:any) => void;
	validationResult: string;
	selectAlert: (alert:string) => void;
	
	//rule execution options
	fromDate: string;
	toDate: string;
	fromTime: string;
	toTime: string;
	intervals: number;
	duration: number;
	email: string;
	template_group: string;
	setInterval: () => void;
	setDuration: () => void;
	
	//rule execution
	running: boolean;
	test: () => void;
}



bosunControllers.controller('Config2Ctrl', ['$scope', '$http', '$location', '$route', '$timeout', function($scope: IConfig2Scope, $http: ng.IHttpService, $location: ng.ILocationService, $route: ng.route.IRouteService, $timeout: ng.ITimeoutService) {
	var search = $location.search();
	$scope.fromDate = search.fromDate || '';
	$scope.fromTime = search.fromTime || '';
	$scope.toDate = search.toDate || '';
	$scope.toTime = search.toTime || '';
	$scope.intervals = +search.intervals || 5;
	$scope.duration = +search.duration || null;
	$scope.config_text = 'Loading config...';
	$scope.selected_alert = search.alert || '';
	$scope.items = parseItems();
	
	function parseItems() : { [type: string]: string[]; }{
		var configText = $scope.config_text;
		var re = /^\s*(alert|template|notification|lookup|macro)\s+([\w\-\.\$]+)\s*\{/gm; 
		var match;
		var items : { [type: string]: string[]; } = {};
		items["alert"] = [];
		items["template"] = [];
		items["lookup"] = [];
		items["notification"] = [];
		items["macro"] = [];
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

	var editor;
	
	$http.get('/api/config')
		.success((data) => {
			$scope.config_text = data;
			$scope.items = parseItems();
			if(!$scope.selected_alert && $scope.items["alert"].length){
				$scope.selected_alert = $scope.items["alert"][0];
			}
			$timeout(()=>{ 
				//can't scroll editor until after control is updated. Defer it.
				$scope.scrollTo("alert",$scope.selected_alert)
			})
			
		})
		.error(function(data) {
   			$scope.validationResult = "Error fetching config: " + data;
  		})
	
	$scope.aceLoaded = function(_editor){
		editor = _editor;
		editor.getSession().setUseWrapMode(true);
		editor.on("blur", function(){
			$scope.$apply(function () {
            		$scope.items = parseItems();
        		});
		});
	};
	
	$scope.scrollTo = (type:string, name:string) => {
		var searchRegex = new RegExp("^\\s*"+type+"\\s+"+name+"\\s*\\{", "gm");
		editor.find(searchRegex,{
    			backwards: false,
    			wrap: true,
    			caseSensitive: false,
    			wholeWord: false,
    			regExp: true,
		});
		if (type == "alert"){$scope.selectAlert(name);}
	}
	
	$scope.setInterval = () => {
		var from = moment.utc($scope.fromDate + ' ' + $scope.fromTime);
		var to = moment.utc($scope.toDate + ' ' + $scope.toTime);
		if (!from.isValid() || !to.isValid()) {
			return;
		}
		var diff = from.diff(to);
		if (!diff) {
			return;
		}
		var intervals = +$scope.intervals;
		if (intervals < 2) {
			return;
		}
		diff /= 1000 * 60;
		var d = Math.abs(Math.round(diff / intervals));
		if (d < 1) {
			d = 1;
		}
		$scope.duration = d;
	};
	
	$scope.selectAlert = (alert:string) =>{
		$scope.selected_alert = alert;
		$location.search("alert",alert);
	}
	
	return $scope;
}]);