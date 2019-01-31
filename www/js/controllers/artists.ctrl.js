// Artists

angular.module('rewind.controllers').controller('ArtistsCtrl', function ($scope, rewindDB, rewindConfig) {

    $scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';

    // Get artists
    $scope.$on('$ionicView.afterEnter', function () {
        rewindDB.getArtists().then(function (artists) {
            $scope.artists = artists;
        });
    });

    // Refresh artists
    $scope.refreshArtists = function () {
        rewindDB.getArtists().then(function (artists) {
            $scope.artists = artists;
        });
		$scope.$broadcast('scroll.refreshComplete');
    };

});