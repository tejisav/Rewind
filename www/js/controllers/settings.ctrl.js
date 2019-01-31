// Settings

angular.module('rewind.controllers').controller('SettingsCtrl', function (AppConfig, $scope, rewindDB, $cordovaToast, $ionicPopup, $localstorage, $cordovaStatusbar, $ionicPopup) {

    $scope.isSearchingArtworks = false;
    $scope.isSearchingArtists = false;

    $scope.config = { showStatusBar: ($localstorage.get('showStatusBar', 'true') === 'true'), goToPlayer: ($localstorage.get('goToPlayer', 'true') === 'true') };

    $scope.toggleStatusBar = function () {
        $localstorage.set('showStatusBar', $scope.config.showStatusBar);
        if ($scope.config.showStatusBar) {
            $cordovaStatusbar.show();
        } else {
            $cordovaStatusbar.hide();
        }
    };

    // Go to player on play
    $scope.toggleGoToPlayer = function () {
        $localstorage.set('goToPlayer', $scope.config.goToPlayer);
    };

    // Find missing album covers
    $scope.findMissingArtworks = function () {
        if (!$scope.isSearchingArtworks) {
            $scope.downloadArtworks = function (albums) {
                $scope.myPopup.close();
                $scope.myPopup = null;
                $scope.isSearchingArtworks = true;
                rewindDB.downloadArtworks(albums).then(function (nbArtworks) {
                    $scope.isSearchingArtworks = false;
                    $cordovaToast.showShortTop('Updated ' + nbArtworks + ' new album covers !');
                }, function (error) {
                    $scope.isSearchingArtworks = false;
                });
            };
            $scope.myPopup = $ionicPopup.show({
                template: '<button class="button button-full button-positive" ng-click="downloadArtworks(' + "'all'" + ')">All</button>' +
                    '<button class="button button-full button-balanced" ng-click="downloadArtworks(' + "'missing'" + ')">Missing</button>',
                title: 'Update album covers',
                subTitle: '',
                scope: $scope,
                buttons: [
                    //{
                    //text: '<b>All</b>',
                    //type: 'button-positive',
                    //onTap: function(e){
                    //$scope.downloadArtworks('all');
                    //}
                    //},
                    //{
                    //text: '<b>Missings</b>',
                    //type: 'button-balanced',
                    //onTap: function(e){
                    //$scope.downloadArtworks('missing');
                    //}
                    //},
                    {
                        text: 'Cancel',
                        onTap: function (e) {
                            $scope.myPopup.close();
                        }
                    }
                ]
            });
        }
    };

    // Find artists names
    $scope.findArtistNames = function () {
        if (!$scope.isSearchingArtists) {
            $scope.isSearchingArtists = true;
            rewindDB.correctArtistNames().then(function (nbArtists) {
                $scope.isSearchingArtists = false;
                $cordovaToast.showShortTop('Updated ' + nbArtists + ' names !');
            }, function (error) {
                $scope.isSearchingArtists = false;
            });
        }
    };

    // Clear Database
    $scope.clearAllDatabase = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete all data',
            template: 'Are you sure ?',
            okText: 'Delete',
            okType: 'button-assertive'
        });

        confirmPopup.then(function (res) {
            if (res) {
                // Delete all data
                rewindDB.removeAllArtworks().then(function () {
                    rewindDB.flushDatabase().then(function () {
                        $localstorage.clear();
                        $cordovaToast.showShortTop('Database cleared !');
                    }, function (err) {
                        console.error(err);
                    });
                });
            }
        });
    };

});