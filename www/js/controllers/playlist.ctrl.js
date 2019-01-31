// Playlists

angular.module('rewind.controllers').controller('PlaylistsCtrl', function ($scope, rewindDB, $ionicPopup, $cordovaToast, rewindConfig, rewindPlayer, $ionicPopover, $ionicViewSwitcher, $state, $localstorage) {

	$scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';

	// Refresh view
	function refreshData() {
		rewindDB.getSpecialPlaylists(4).then(function (specialPlaylists) {
			$scope.specialPlaylists = specialPlaylists;
		});
		rewindDB.getPlaylists().then(function (playlists) {
			$scope.playlists = playlists;
		});
	}

	$scope.$on('$ionicView.beforeEnter', function () {
		refreshData();
	});

	// New playlist popup
	$scope.newPlaylist = function () {

		// submit new playlist
		$scope.submitNewPlaylist = function () {
			cordova.plugins.Keyboard.close();
			var newPlaylistName = $scope.dataPopup.newPlaylistName;
			if (newPlaylistName === '') {
				$cordovaToast.showShortTop('Playlist name can not be empty !');
			} else {
				myPopup.close();
				rewindDB.addPlaylist(newPlaylistName).then(function (res) {
					$cordovaToast.showShortTop('Playlist created !');
					rewindDB.getPlaylists().then(function (playlists) {
						$scope.playlists = playlists;
					});
				}, function (err) {
					$cordovaToast.showShortTop('Error : ' + err);
				});
			}
		};

		$scope.dataPopup = {};
		var myPopup = $ionicPopup.show({
			template: '<form ng-submit="submitNewPlaylist()"><input type="text" ng-model="dataPopup.newPlaylistName"></form>',
			title: 'New playlist',
			subTitle: "Enter the playlist's name",
			scope: $scope,
			buttons: [
				{
					text: 'Cancel',
					type: 'button-light',
					onTap: function (e) {
						myPopup.close();
					}
				},
				{
					text: 'Save',
					type: 'button-light',
					onTap: $scope.submitNewPlaylist
				}
			]
		});
	};

	// Popover
	setTimeout(function () {
		document.body.classList.remove('platform-ios');
		document.body.classList.remove('platform-android');
		document.body.classList.remove('platform-ionic');
		document.body.classList.add('platform-ionic');
	}, 500);

	var selectedPlaylist;
	var event;
	$scope.showPopover = function (ev, playlist) {
		ev.preventDefault();
		event = ev;
		selectedPlaylist = playlist;

		$ionicPopover.fromTemplateUrl('templates/playlist-popover.html', {
			scope: $scope,
		}).then(function (popover) {
			$scope.popover = popover;
			popover.show(event);

			// Start playing the selected playlist
			$scope.startPlaylist = function () {
				rewindDB.getPlaylistItems(selectedPlaylist.id).then(function (playlist) {
					rewindPlayer.loadPlaylist(playlist);
					rewindPlayer.launchPlayerByIndex(0); // Start at first title
					if ($localstorage.get('goToPlayer', 'true') === 'true') {
						$ionicViewSwitcher.nextDirection('forward');
						$state.go('player');
					}
				});
				$scope.popover.hide();

			};

			// Delete playlist
			$scope.deletePlaylist = function () {
				rewindDB.deletePlaylist(selectedPlaylist.id).then(function () {
					$cordovaToast.showShortTop('Playlist Deleted');
					refreshData();
				});
				$scope.popover.hide();
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