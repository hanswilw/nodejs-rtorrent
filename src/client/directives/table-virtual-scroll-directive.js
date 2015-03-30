function tableVirtualScroll () {

  function controller() {

    var vm = this;

    vm.params = {
      skip: 0,
      limit: 40,
      sortBy: 'name',
      reverse: false,
      filter: ''
    };

    vm.dataCache = {
      top: [],
      bottom: [],
      totalLoaded: vm.tableVirtualScrollOptions.dataSource.data.length
    };

    // conducting a sort resets the table and caching
    vm.sort = function (sortBy) {
      vm.params.sortBy = sortBy;
      vm.params.reverse = !vm.params.reverse;
      vm.params.skip = 0;
      vm.params.limit = 40;

      vm.tableVirtualScrollOptions
        .getData(vm.params)
        .then(function (data) {

          vm.tableVirtualScrollOptions.dataSource = {
            data: data.data,
            totalSize: data.total
          };

          vm.dataCache = {
            top: [],
            bottom: [],
            totalLoaded: data.data.length
          };

          vm.params.skip = vm.params.skip + vm.params.limit;
          vm.begin = 0;
          vm.end = data.data.length - 1;

          vm.rowCounter = data.data.length;
          vm.resetPadding();

        });
    };

    vm.isSortAscDesc = function (sortBy) {
      if (vm.params.sortBy === sortBy ) {
        if (!vm.params.reverse) {
          return 'fa-caret-up';
        }

        return 'fa-caret-down';
      }
    };

    vm.tableVirtualScrollOptions.inViewHashes = [];

    vm.rowInView = function (inView, id) {
      var index = vm.tableVirtualScrollOptions.inViewHashes.indexOf(id);
      if (index > -1) {
        if (inView) {
          return;
        }
        vm.tableVirtualScrollOptions.inViewHashes.splice(index, 1);
      } else {
        if (inView) {
          vm.tableVirtualScrollOptions.inViewHashes.push(id);
        } else {
          return;
        }
      }
    };

    function deleteRow(hash) {
      console.log('deleting hash', hash);
      var totalArray = vm.tableVirtualScrollOptions.dataSource.data
        .concat(vm.dataCache.top)
        .concat(vm.dataCache.bottom);
      var index = _.findIndex(totalArray, function (torrent) {
        return torrent.hash === hash;
      });

      // concat arrays in order of main, top, bottom
      // if index is in the range of main, top, or bottom, then the
      // item is in that array. when found, slice it out
      if (index > -1) {
        console.log('main', vm.tableVirtualScrollOptions.dataSource.data.length);
        console.log('top', vm.dataCache.top.length);
        console.log('bottom', vm.dataCache.bottom.length);
        console.log('delete index', index);
        // if within main array, remove
        if (vm.tableVirtualScrollOptions.dataSource.data.length > index && index > 0) {
          vm.tableVirtualScrollOptions.dataSource.data.splice(index, 1);
          vm.end--;
          vm.rowCounter--;
        }

        var mainTopLength = vm.dataCache.top.length + vm.tableVirtualScrollOptions.dataSource.data.length;
        if (mainTopLength > index && index > vm.tableVirtualScrollOptions.dataSource.data.length) {
          vm.dataCache.top.splice(index - vm.tableVirtualScrollOptions.dataSource.data.length, 1);
          vm.end--;
          vm.rowCounter--;
        }

        if (totalArray.length > index && index > mainTopLength) {
          console.log(vm.dataCache.bottom.length);
          vm.dataCache.bottom.splice(index - mainTopLength, 1);
          console.log(vm.dataCache.bottom.length);
          vm.end--;
          vm.rowCounter--;
        }

      }
    }

    vm.tableVirtualScrollOptions.deleteRows = function (hashes) {
      for (var i = hashes.length - 1; i >= 0; i--) {
        deleteRow(hashes[i]);
      }
    };

  }

  function link(scope, elem, attrs, ctrl) {

    var ROW_HEIGHT = 46;
    var MAX_ROW_MULTIPLIER = 4;
    var MIN_ROW_MULTIPLIER = 3;
    var V_BOTTOM_PADDING_CLASSNAME = '.table-virtual-bottom';
    var V_TOP_PADDING_CLASSNAME = '.table-virtual-top';

    var scrollingContainer = elem.parent();
    var tbody = elem.find('tbody');

    tbody.prepend('<tr class="table-virtual-top"></tr>');
    tbody.append('<tr class="table-virtual-bottom"></tr>');


    var vBottomPaddingElem = elem.find(V_BOTTOM_PADDING_CLASSNAME);
    var vTopPaddingElem = elem.find(V_TOP_PADDING_CLASSNAME);

    ctrl.dataCache.totalLoaded = ctrl.tableVirtualScrollOptions.dataSource.data.length;

    ctrl.params.limit = 50;
    ctrl.params.skip = ctrl.dataCache.totalLoaded;

    ctrl.containerHeight = scrollingContainer[0].offsetHeight;

    ctrl.viewableRows = Math.ceil(ctrl.containerHeight / 46) < 10 ? 10 : Math.ceil(ctrl.containerHeight / 46);
    ctrl.maxRows = ctrl.viewableRows * MAX_ROW_MULTIPLIER;
    ctrl.minRows = ctrl.viewableRows * MIN_ROW_MULTIPLIER;
    console.log('min rows', ctrl.minRows);
    console.log('max rows', ctrl.maxRows);

    ctrl.dataCache.bottom = ctrl.tableVirtualScrollOptions.dataSource.data.splice(ctrl.minRows, ctrl.tableVirtualScrollOptions.dataSource.data.length);
    // console.log('initial table data after splice', scope.tableData);
    // console.log('initial bottom cache after splice', scope.bottomCache);

    ctrl.rowCounter = ctrl.tableVirtualScrollOptions.dataSource.data.length;
    console.log('row counter after splice', ctrl.rowCounter);

    ctrl.begin = 0;
    ctrl.end = ctrl.tableVirtualScrollOptions.dataSource.data.length - 1;

    // calculate padding
    ctrl.vBottomPaddingElemHeight = (ctrl.tableVirtualScrollOptions.dataSource.totalSize - ctrl.maxRows) * ROW_HEIGHT;
    ctrl.vTopPaddingElemHeight = 0;

    ctrl.resetPadding = function () {
      ctrl.vTopPaddingElemHeight = 0;
      ctrl.vBottomPaddingElemHeight = (ctrl.tableVirtualScrollOptions.dataSource.totalSize - ctrl.maxRows) * ROW_HEIGHT;

      vTopPaddingElem.height(ctrl.vTopPaddingElemHeight);
      vBottomPaddingElem.height(ctrl.vBottomPaddingElemHeight);
      scrollingContainer[0].scrollTop = 0;
    };

    // set height of bottom padding element
    vBottomPaddingElem.height(ctrl.vBottomPaddingElemHeight);

    // function padBottomRow(scrolledAmount) {
    //   return vBottomPaddingElemHeight + (ROW_HEIGHT * scrolledAmount);
    // }

    // function trimBottomRow(scrolledAmount) {
    //   return vBottomPaddingElemHeight - (ROW_HEIGHT * scrolledAmount);
    // }

    // function padTopRow(scrolledAmount) {
    //   return vTopPaddingElemHeight + (ROW_HEIGHT * scrolledAmount);
    // }

    // function trimTopRow(scrolledAmount) {
    //   return vTopPaddingElemHeight - (ROW_HEIGHT * scrolledAmount);
    // }

    // add more rows to bottom of list from cache
    function restoreBottomRow() {
      // console.log('restore bottom row');
      ctrl.tableVirtualScrollOptions.dataSource.data.push(ctrl.dataCache.bottom.shift());
      ctrl.vBottomPaddingElemHeight = ctrl.vBottomPaddingElemHeight - ROW_HEIGHT;
      vBottomPaddingElem[0].style.height = ctrl.vBottomPaddingElemHeight + 'px';
      ctrl.rowCounter++;
      ctrl.end++;
      // console.log('table data length:', scope.tableData.length);
    }

    // remove top row and puts it into cache
     function cacheTopRow() {
      // console.log('cache top row');
      ctrl.dataCache.top.push(ctrl.tableVirtualScrollOptions.dataSource.data.shift());
      ctrl.vTopPaddingElemHeight = ctrl.vTopPaddingElemHeight + ROW_HEIGHT;
      vTopPaddingElem[0].style.height = ctrl.vTopPaddingElemHeight + 'px';
      ctrl.rowCounter--;
      ctrl.begin++;
    }

    // removes bottom row and puts it into cache
     function cacheBottomRow() {
      // console.log('cache bottom row');
      ctrl.dataCache.bottom.unshift(ctrl.tableVirtualScrollOptions.dataSource.data.pop());
      ctrl.vBottomPaddingElemHeight = ctrl.vBottomPaddingElemHeight + ROW_HEIGHT;
      vBottomPaddingElem[0].style.height = ctrl.vBottomPaddingElemHeight + 'px';
      ctrl.rowCounter--;
      ctrl.end--;
      // console.log('bottom cache length:', scope.bottomCache.length);
      // console.log('table data length:', scope.tableData.length);
    }

    // adds more rows to top from cache
     function restoreTopRow() {
      // console.log('restore top row');
      ctrl.tableVirtualScrollOptions.dataSource.data.unshift(ctrl.dataCache.top.pop());
      ctrl.vTopPaddingElemHeight = ctrl.vTopPaddingElemHeight - ROW_HEIGHT;
      vTopPaddingElem[0].style.height = ctrl.vTopPaddingElemHeight + 'px';
      ctrl.rowCounter++;
      ctrl.begin--;
      // console.log('top cache length:', scope.topCache.length);
    }

    function scrollDown() {
      // dont show more if bottom cache list is 0;
      if (ctrl.dataCache.bottom.length > 0) {
        restoreBottomRow();
      }

      // dont cache the top row if row counter is more than the max viewable rows
      if (ctrl.end === ctrl.tableVirtualScrollOptions.dataSource.totalSize - 1) {
        if (ctrl.rowCounter > ctrl.minRows) {
          cacheTopRow();
        }
      } else if (ctrl.begin === 0) {
        if (ctrl.rowCounter > ctrl.maxRows) {
          cacheTopRow();
        }
      } else {
        cacheTopRow();
      }


      // console.log('row counter after scroll', rowCounter);
    }

    function scrollUp() {
      if (ctrl.dataCache.top.length > 0) {
        restoreTopRow();
      }

      if (ctrl.end === ctrl.tableVirtualScrollOptions.dataSource.totalSize - 1) {
        if (ctrl.rowCounter > ctrl.maxRows) {
          cacheBottomRow();
        }
      } else if (ctrl.begin === 0) {
        if (ctrl.rowCounter > ctrl.maxRows) {
          cacheBottomRow();
        }
      } else {
        cacheBottomRow();
      }
      // console.log('row counter after scroll', rowCounter);
    }

    var loading = false;

    function loadPageData() {
      if (loading) {
        return;
      }

      // console.log('top cache length and total loaded', topCache.length, totalLoaded);
      if (ctrl.dataCache.bottom.length < ctrl.minRows) {
        if (ctrl.tableVirtualScrollOptions.dataSource.totalSize > ctrl.dataCache.totalLoaded) {
          console.log('total loaded is less than total size');
          loading = true;
          ctrl.tableVirtualScrollOptions
            .getData(ctrl.params)
            .then(function (data) {
              ctrl.params.skip = ctrl.params.skip + ctrl.params.limit;
              ctrl.dataCache.bottom = ctrl.dataCache.bottom.concat(data.data);
              ctrl.dataCache.totalLoaded = ctrl.dataCache.totalLoaded + data.data.length;
              loading = false;
              // console.log('loaded data amount:', scope.totalLoaded);
              // console.log('bottom cache amount:', scope.bottomCache.length);
              // console.log('top cache amount:', scope.topCache.length);
            });
        } else if (ctrl.tableVirtualScrollOptions.dataSource.totalSize === ctrl.dataCache.totalLoaded) {
          console.log('total size is equal to total loaded');
        }
      }
    }



    // scope.$watch(function() {
    //   return scrollingContainer[0].offsetHeight;
    // }, function(newValue) {
    //   var oldViewableRows = scope.viewableRows;
    //   scope.viewableRows = Math.ceil(newValue / 46);
    //   scope.maxRows = scope.viewableRows * 4;
    //   scope.minRows = scope.viewableRows * 3;

    //   console.log('viewable rows after resize', scope.viewableRows);
    //   console.log('max viewable rows after resize', scope.maxRows);
    //   console.log('minRows viewable rows after resize', scope.minRows);

    //   var count = 0;

    //   // screen expanded
    //   if (scope.minRows > oldViewableRows * 3) {

    //     do {
    //       console.log('showing more');

    //       if (rowCounter > scope.maxRows) {
    //         return;
    //       }

    //       if (scope.topCache.length > 0) {
    //         restoreTopRow();
    //       }

    //       if (scope.bottomCache.length > 0) {
    //         restoreBottomRow();
    //       }

    //       count++;
    //     } while (count < (scope.minRows - oldViewableRows * 3));

    //   }

    //   // screen shrunk
    //   if (oldViewableRows * 2 > scope.minRows) {

    //     count = 0;
    //     do {
    //       console.log('showing less');

    //       if (rowCounter > scope.maxRows) {
    //         return;
    //       }

    //       cacheBottomRow();
    //       count++;
    //     } while (count < (oldViewableRows * 2 - scope.minRows));
    //   }

    // });



    var lastScrollTop = 0;

    // scroll top initial is 0
    var st = 0;

    var sensitivity = 46;

    function tableScroll() {

      ticking = false;

      // last known scroll top is set to current st
      var currentSt = st;

      // console.log('scrolltop', currentSt);

      var scrollAmount = 0;
      var count = 0;

      if (currentSt > lastScrollTop) {

        // console.log('currentSt', currentSt, 'lastScrollTop', lastScrollTop);

        scrollAmount = Math.floor((currentSt - lastScrollTop) / sensitivity);

        if (scrollAmount < 1) {
          return;
        }

        // console.log('scrolling down', scrollAmount, 'times');

        do {
          count++;
          scrollDown();
        } while (count < scrollAmount);

      } else {

        scrollAmount = Math.floor((lastScrollTop - currentSt) / sensitivity);

        if (scrollAmount < 1) {
          return;
        }

        // console.log('scrolling up', scrollAmount, 'times');

        do {
          count++;
          scrollUp();
        } while (count < scrollAmount);
      }

      lastScrollTop = currentSt;
      ticking = false;
      scope.$digest();
    }

    var ticking = false;

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(tableScroll);
        ticking = true;
      }

    }


    scrollingContainer.bind('scroll', function () {
      st = scrollingContainer[0].scrollTop;
      requestTick();
    });

    // scrollingContainer.scroll(function () {
    //   scrolling = true;

    //   if (timeout) {
    //     $timeout.cancel(timeout);
    //   }

    //   timeout = $timeout(function () {
    //     console.log(scrolledAmount, direction);


    //     if (scrolledAmount > 5) {
    //       console.log('scrolled amount is larger than viewable rows');
    //       scrollingContainer[0].scrollTop = threshold;
    //       scrolledAmount = 0;
    //     }

    //     scrolling = false;
    //     scrolledAmount = 0;
    //     direction = 0;

    //   }, 50);

    // });

    // var scrolling = false;
    // var timeout = null;
    // scrollingContainer.scroll(function () {
    //   tbody[0].style.pointerEvents = 'none';
    //   tableScroll();
    //   scrolling = true;

    //   if (timeout) {
    //     $timeout.cancel(timeout);
    //   }

    //   timeout = $timeout(function () {

    //     // if (scrolling) {
    //     //   console.log('timeout fired event');
    //     //   scrollingContainer.trigger('scroll');
    //     // }

    //     // scrolling = false;
    //     tbody[0].style.pointerEvents = 'auto';
    //   }, 200);
    // });

    // setInterval(function () {
    //   if (scrolling) {
    //     scrolling = false;

    //     tableScroll();
    //   }

    // }, 100);

    scrollingContainer.bind('scroll', _.debounce(loadPageData, 100));

  }

	return {
		restrict: 'A',
    scope: {
      tableVirtualScrollOptions: '='
    },
		link: link,
    controller: controller,
    controllerAs: 'tableVirtualScrollCtrl',
    bindToController: true,
    templateUrl: 'directives/table-virtual-scroll.tpl.html'
	};
}

angular
	.module('app')
	.directive('tableVirtualScroll', [tableVirtualScroll]);