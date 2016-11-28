var app = angular.module('myApp',  ['ngRoute']);
app.controller('MainController', function($scope, $route, $routeParams, $location) {
     $scope.$route = $route;
     $scope.$location = $location;
     $scope.$routeParams = $routeParams;
 });

app.controller('myCtrl', function($scope, $http) {
  $http.get("/api/devices")
  .then(function(response) {
      $scope.devices = response.data;
  });
});

app.controller('remoteConfigCtrl', function($scope, $http) {
    $scope.configname = '';
    $scope.setGroup = function(group){
        $scope.configname = group.name;
        $scope.config = group.config;
        $scope._id = group._id;
        console.log(group);
    };
    $scope.putConfig = function(){
        $http.put("/api/groups/"+$scope._id, $scope.config);
        console.log($scope.config);
    };
  $http.get("/api/groups")
  .then(function(response) {
      $scope.groups = response.data;
      $scope.setGroup(response.data[0]);
  });
});

app.controller('softwareConfigCtrl', function($scope, $http) {
    $scope.configname = '';
    $scope.setGroup = function(group){
        $scope.configname = group.name;
        $scope.software = group.software;
        $scope._id = group._id;
        console.log(group);
    };
    $scope.putSoftware = function(){
        $http.put("/api/group/software/"+$scope._id, $scope.software);
        console.log($scope.software);
    };
  $http.get("/api/groups")
  .then(function(response) {
      $scope.groups = response.data;
      $scope.setGroup(response.data[0]);
  });
});

app.config(function($routeProvider, $locationProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'dashboard.html',
    controller: 'myCtrl'
  })
  .when('/config', {
    templateUrl: 'config.html',
    controller: 'remoteConfigCtrl'
  }).when('/software', {
    templateUrl: 'software.html',
    controller: 'softwareConfigCtrl'
  });

  // configure html5 to get links working on jsfiddle
  $locationProvider.html5Mode(true);
});

app.directive('showTab', function () {
    return {
        link: function (scope, element, attrs) {
            element.click(function (e) {
                e.preventDefault();
                jQuery(element).tab('show');
            });
        }
    };
});