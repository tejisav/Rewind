// Search

angular.module('rewind.controllers').controller('SearchCtrl', function ($scope, rewindDB, rewindConfig, rewindPlayer, $ionicViewSwitcher, $state, $timeout, $ionicPopover, $cordovaToast, $localstorage, firebase) {
    
    $scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';

    // Focus on search
    $scope.$on('$ionicView.beforeEnter', function () {
        $timeout(function () {
            var searchElement = angular.element(document.getElementById('search-input'));
            searchElement[0].focus();
            cordova.plugins.Keyboard.show();
        }, 150);
        
		if (firebase.auth().currentUser != null) {
			$scope.session = true;
		}
		else {
			$scope.session = false;
		}
    });

    // Watch for search update
    $scope.$watch('search', function () {
        var search = $scope.search;
        if (search) {
            $timeout(function () {
                searchInDB(search);
            }, 400);
        } else {
            $scope.titles = [];
        }
    });

    $scope.cancel = function () {
        $scope.hideKeyboard();
        $scope.search = '';
        $scope.titles = [];
    };

    // Hide keyboard on enter
    $scope.hideKeyboard = function () {
        cordova.plugins.Keyboard.close();
    };

    $scope.playTitle = function (title) {
        $scope.hideKeyboard();
        rewindPlayer.loadPlaylist($scope.titles);
        rewindPlayer.launchPlayer(title);
        if ($localstorage.get('goToPlayer', 'true') === 'true') {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('player');
        }
    };

    // Search function
    function searchInDB(search) {
        if (search == $scope.search && search.length > 0) {
            rewindDB.search(search).then(function (titles) {
                $scope.titles = titles;
            });
        }
    }

    $scope.uploadFiles = function (reference, path, callback) {
			
		// After you get the URI of the file
		window.resolveLocalFileSystemURL(path, function(fileEntry) {
			fileEntry.file(function(file) {
				var reader = new FileReader();

				reader.onloadend = function() {
					var fileBlob = new Blob([this.result], { type: file.type });
					
					var storageRef = firebase.storage().ref();
					var uploadTask = storageRef.child(reference).put(fileBlob);

					uploadTask.on('state_changed', function(snapshot) {
						var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
						$cordovaToast.showShortTop(progress);
					}, function(error) {
						console.log(error);
					}, function() {
						uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
							callback(downloadURL);
						});
					});
				};

				reader.readAsArrayBuffer(file);
			});
		});
    }
    
    // Popover
    var selectedTitle;
    var event;
    $scope.showPopover = function (ev, title) {
        $scope.hideKeyboard();
        ev.stopPropagation();
        event = ev;
        selectedTitle = title;
        $ionicPopover.fromTemplateUrl('templates/title-popover.html', {
            scope: $scope,
        }).then(function (popover) {
            $scope.popover = popover;
            $scope.popover.show(event);

            // add the title to an existing playlist
            $scope.addToPlaylist = function () {
                $scope.popover.hide();
                $ionicPopover.fromTemplateUrl('templates/select-playlist-popover.html', {
                    scope: $scope,
                }).then(function (popover) {
                    // Get playlists
                    rewindDB.getPlaylistsNames().then(function (playlists) {
                        $scope.playlists = playlists;
                        $scope.popover = popover;
                        $scope.popover.show(event);
                        $scope.addTitleToPlaylist = function (playlistId) {
                            rewindDB.addTitleToPlaylist(playlistId, selectedTitle.id).then(function () {
                                $cordovaToast.showShortTop('Done !');
                                $scope.popover.hide();
                            });
                        };
                    });

                });

            };

            // Add the current title as next on the current playlist
            $scope.addNext = function () {
                rewindPlayer.setNext(selectedTitle);
                $scope.popover.hide();
                $cordovaToast.showShortTop('Done !');
            };
			// Upload the current title to cloud
			$scope.upload = function () {
				$cordovaToast.showShortTop('Uploading Song');
				var cloudTile = {};
				Object.assign(cloudTile, selectedTitle);
				cloudTile.cloud = true;
				$scope.uploadFiles(firebase.auth().currentUser.email + '/artworks/' + cloudTile.name, $scope.miniaturesPath + cloudTile.artwork, function(artworkURL) {
					cloudTile.artwork = artworkURL;
					$scope.uploadFiles(firebase.auth().currentUser.email + '/titles/' + cloudTile.name, cloudTile.path, function(songURL) {
						cloudTile.path = songURL;
						console.log(JSON.stringify(cloudTile));
						firebase.firestore().collection(firebase.auth().currentUser.email).doc(cloudTile.name).set(cloudTile)
						.then(function() {
							$cordovaToast.showShortTop('Done !');
						})
						.catch(function(error) {
							$cordovaToast.showShortTop('Error !');
						});
					});
				});
				popover.hide();
			};
        });
    };

    var destroy = true;
    $scope.$on('popover.hidden', function () {
        if (destroy) {
            destroy = false;
            $scope.popover.remove().then(function () {
                $scope.popover = null;
                destroy = true;
            });
        }
    });

});