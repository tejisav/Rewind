// Titles

angular.module('rewind.controllers').controller('SongsCtrl', function ($scope, $state, rewindDB, rewindPlayer, $cordovaToast, $cordovaFile, $ionicViewSwitcher, $ionicPopover, $cordovaToast, rewindConfig, $localstorage, firebase) {

	$scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';

	// Get artist titles
	$scope.$on('$ionicView.afterEnter', function () {
		rewindDB.getAllTitles().then(function (data) {
			$scope.titles = data.titles;
			$scope.playlist = data.playlist;
		});
		if (firebase.auth().currentUser != null) {
			$scope.session = true;
		}
		else {
			$scope.session = false;
		}
	});
	
	$scope.refreshSongs = function () {
		rewindDB.getAllTitles().then(function (data) {
			$scope.titles = data.titles;
			$scope.playlist = data.playlist;
			$scope.$broadcast('scroll.refreshComplete');
		});
	};

	// Start playing titles
	$scope.playTitle = function (title) {
		rewindPlayer.loadPlaylist($scope.playlist);
		rewindPlayer.launchPlayer(title);
		if ($localstorage.get('goToPlayer', 'true') === 'true') {
			$ionicViewSwitcher.nextDirection('forward');
			$state.go('player');
		}
	};

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
		ev.stopPropagation();
		event = ev;
		selectedTitle = title;

		$ionicPopover.fromTemplateUrl('templates/title-popover.html', {
			scope: $scope,
		}).then(function (popover) {
			$scope.popover = popover;
			popover.show(event);

			// add the title to an existing playlist
			$scope.addToPlaylist = function () {
				popover.hide();
				$ionicPopover.fromTemplateUrl('templates/select-playlist-popover.html', {
					scope: $scope,
				}).then(function (popover) {
					// Get playlists
					rewindDB.getPlaylistsNames().then(function (playlists) {
						$scope.playlists = playlists;
						$scope.popover = popover;
						popover.show(event);
						$scope.addTitleToPlaylist = function (playlistId) {
							rewindDB.addTitleToPlaylist(playlistId, selectedTitle.id).then(function () {
								$cordovaToast.showShortTop('Done !');
								popover.hide();
							});
						};
					});

				});

			};
			// Add the current title as next on the current playlist
			$scope.addNext = function () {
				$cordovaToast.showShortTop('Add the current title as next on the current playlist');
				rewindPlayer.setNext(selectedTitle);
				popover.hide();
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