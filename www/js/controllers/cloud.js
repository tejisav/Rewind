// Cloud

angular.module('rewind.controllers').controller('CloudCtrl', function ($scope, $state, rewindDB, rewindPlayer, $cordovaToast, $ionicViewSwitcher, $ionicPopover, $cordovaToast, $cordovaFileTransfer, rewindConfig, $localstorage, firebase) {

	document.addEventListener("deviceready", function () {

		firebase.auth().onAuthStateChanged(function (user) {
			$scope.titles = undefined;
			$scope.playlist = undefined;
			if (firebase.auth().currentUser != null) {
				$scope.session = true;
				$scope.fetchSongsList(function () {
					$scope.updateSongsList();
					$scope.$applyAsync();
				});
				$scope.titlesListener = firebase.firestore().collection(firebase.auth().currentUser.email).onSnapshot((querySnapshot) => {
					$scope.titlesData = [];

					console.log(querySnapshot.size);
					querySnapshot.forEach(function (doc) {
						console.log(doc.id, " => ", doc.data());
						$scope.titlesData.push(doc.data());
					});
				});
			}
			else {
				$scope.session = false;
				if ($scope.titlesListener) {
					$scope.titlesListener();
				}
				console.log('auth false');
			}
			$scope.$applyAsync();
			setTimeout(function () { $scope.$applyAsync(); }, 1000);
		});

	}, false);

	$scope.$on('$ionicView.afterEnter', function () {
		$scope.network = true;
		$scope.toggleLoginSignup = false;
		$scope.updateSongsList();
		$scope.$applyAsync();
		setTimeout(function () { $scope.$applyAsync(); }, 1000);
	});

	$scope.toggleLogin = function () {
		$scope.toggleLoginSignup = true;
	};

	$scope.toggleSignup = function () {
		$scope.toggleLoginSignup = false;
	};

	$scope.login = function () {

		if (!$scope.login.email || !$scope.login.password) {
			$scope.loginValidation = '<p>All fields are required.</p>';
			return;
		}

		$scope.loginValidation = '';

		console.log($scope.login.email);
		console.log($scope.login.password);

		firebase.auth().signInWithEmailAndPassword($scope.login.email, $scope.login.password).catch(function (error) {
			// Handle Errors here.
			// var errorCode = error.code;
			$scope.loginValidation = error.message;
			$scope.$applyAsync();
		});
	};

	$scope.signup = function () {

		if (!$scope.signup.email || !$scope.signup.password || !$scope.signup.cpassword) {
			$scope.signupValidation = '<p>All fields are required.</p>';
			return;
		}

		if ($scope.signup.cpassword != $scope.signup.password) {
			$scope.signupValidation = '<p>Password does not match.</p>';
			return;
		}

		$scope.signupValidation = '';

		console.log($scope.signup.email);
		console.log($scope.signup.password);
		console.log($scope.signup.cpassword);

		firebase.auth().createUserWithEmailAndPassword($scope.signup.email, $scope.signup.password).catch(function (error) {
			// Handle Errors here.
			// var errorCode = error.code;
			$scope.signupValidation = error.message;
			$scope.$applyAsync();
		});
	};

	$scope.logout = function () {
		firebase.auth().signOut().then(function () {
			$scope.session = false;
			$scope.$applyAsync();
		}).catch(function (error) {
			console.log('Logout: ' + error.message)
		});
	};

	$scope.fetchSongsList = function (callback) {
		$scope.titlesData = [];
		if (firebase.auth().currentUser != null) {

			firebase.firestore().collection(firebase.auth().currentUser.email).get().then((querySnapshot) => {

				if (querySnapshot.size) {

					var titlesProcessed = 0;

					console.log(querySnapshot.size);
					querySnapshot.forEach(function (doc) {
						// doc.data() is never undefined for query doc snapshots
						console.log(doc.id, " => ", doc.data());
						$scope.titlesData.push(doc.data());
						titlesProcessed++;
						if (titlesProcessed === querySnapshot.size) {
							callback();
						}
					});

				} else {
					callback();
				}
			});

		}
	}

	$scope.updateSongsList = function () {
		$scope.titles = undefined;
		$scope.playlist = undefined;
		if ($scope.titlesData) {
			$scope.titles = $scope.titlesData.slice(0);
			$scope.playlist = $scope.titlesData.slice(0);
		}
	};

	$scope.refreshSongs = function () {
		$scope.fetchSongsList(function () {
			$scope.updateSongsList();
			$scope.$applyAsync();
		});
		$scope.$broadcast('scroll.refreshComplete');
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

	// Popover
	var selectedTitle;
	var event;
	$scope.showPopover = function (ev, title) {
		ev.stopPropagation();
		event = ev;
		selectedTitle = title;

		$ionicPopover.fromTemplateUrl('templates/title-popover2.html', {
			scope: $scope,
		}).then(function (popover) {
			$scope.popover = popover;
			popover.show(event);

			// Add the current title as next on the current playlist
			$scope.addNext = function () {
				$cordovaToast.showShortTop('Add the current title as next on the current playlist');
				rewindPlayer.setNext(selectedTitle);
				popover.hide();
				$cordovaToast.showShortTop('Done !');
			};

			// add the title to an existing playlist
			$scope.download = function () {
				$cordovaToast.showShortTop('Downloading current title');

				var fileTransfer = new FileTransfer();
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
					fileTransfer.download(selectedTitle.path, fileSystem.root.toURL() + '/Rewind/' + selectedTitle.name + '.mp3', function (entry) {
						$cordovaToast.showShortTop('Done !');
					}, function (error) {
						console.log("Download error code" + error.code);
					});
				});
				popover.hide();
			};

			// add the title to an existing playlist
			$scope.delete = function () {
				$cordovaToast.showShortTop('Deleting current title');

				var storageRef = firebase.storage().ref();

				var artworkRef = storageRef.child(firebase.auth().currentUser.email + '/artworks/' + selectedTitle.name);
				artworkRef.delete().then(function () {
					var songRef = storageRef.child(firebase.auth().currentUser.email + '/titles/' + selectedTitle.name);
					songRef.delete().then(function () {
						firebase.firestore().collection(firebase.auth().currentUser.email).doc(selectedTitle.name).delete()
							.then(function () {
								console.log("Document deleted with ID: ", selectedTitle.name);

								$scope.fetchSongsList(function () {
									$scope.updateSongsList();
									$scope.$applyAsync();
								});

								$cordovaToast.showShortTop('Done !');
							})
							.catch(function (error) {
								console.error("Error deleting document: ", error);
							});
					}).catch(function (error) {
						console.log(error);
					});
				}).catch(function (error) {
					console.log(error);
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