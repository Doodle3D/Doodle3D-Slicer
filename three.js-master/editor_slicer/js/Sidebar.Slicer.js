Sidebar.Slicer = function ( editor ) {

	var USER_SETTINGS, PRINTER_SETTINGS, selectedPrinter;

	var sceneHelper = editor.sceneHelpers;

	var boundingBox = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());

	var bbox = new THREE.BoundingBoxHelper( boundingBox, 0xff0000 );
	bbox.update();
	sceneHelper.add( bbox );

	function settingsLoaded () {

		printer.updateConfig(USER_SETTINGS);

		var options = {};

		for (var i in PRINTER_SETTINGS) {
			options[i] = i;
		}

		printerType.setOptions(options);

	}

	var container = new UI.CollapsiblePanel();
	container.setCollapsed( editor.config.getKey( 'ui/sidebar/slicer/collapsed' ) );
	container.onCollapsedChange( function ( boolean ) {

		editor.config.setKey( 'ui/sidebar/slicer/collapsed', boolean );

	} );

	var printer = new D3D.Printer();

	var localIp = location.hash.substring(1);
	var doodleBox = new D3D.Box(localIp).init();

	container.addStatic( new UI.Text( 'SLICER' ) );
	container.add( new UI.Break() );

	function createRow (name) {

		var row = new UI.Panel();

		row.add( new UI.Text( name ).setWidth( '150px' ) );

		var fill = new UI.Text( '' ).setWidth( '90px' );
		row.add(fill);

		container.add(row);

		return fill;

	}

	var state = createRow('State');
	var bedTemperature = createRow('Bed Temperature');
	var bedTargetTemperature = createRow('Bed Target Temperature');
	var nozzleTemperature = createRow('Nozzle Temperature');
	var nozzleTargetTemperature = createRow('Nozzle Target Temperature');
	var currentLine = createRow('Current Line');
	var bufferedLines = createRow('Buffered Lines');
	var totalLines = createRow('Total Lines');
	var printBatches = createRow('Print Batches');

	doodleBox.onupdate = function (data) {
		state.setValue(data["state"]);
		bedTemperature.setValue(data["bed"]);
		bedTargetTemperature.setValue(data["bed_target"]);
		nozzleTemperature.setValue(data["hotend"]);
		nozzleTargetTemperature.setValue(data["hotend_target"]);
		currentLine.setValue(data["current_line"]);
		bufferedLines.setValue(data["buffered_lines"]);
		totalLines.setValue(data["total_lines"]);
		printBatches.setValue(doodleBox._printBatches.length);
	};

	var printerTypeRow = new UI.Panel();
	var printerType = new UI.Select().setWidth( '150px' );
	printerType.onChange( function () {

		var type = printerType.getValue();
		selectedPrinter = type;

		printer.updateConfig(PRINTER_SETTINGS[selectedPrinter]);

		boundingBox.geometry = new THREE.BoxGeometry(printer.config.dimensionsY, printer.config.dimensionsZ, printer.config.dimensionsX);
		boundingBox.position.x = printer.config.dimensionsY/2;
		boundingBox.position.y = printer.config.dimensionsZ/2;
		boundingBox.position.z = printer.config.dimensionsX/2;

		bbox.update();

	} );

	printerTypeRow.add( new UI.Text( 'Printer' ).setWidth( '90px' ) );
	printerTypeRow.add( printerType );

	container.add( printerTypeRow );

	var progress = createRow("Progress");
	
	var slice = new UI.Button( 'Slice' );
	slice.onClick( function () {

		if (selectedPrinter === undefined) {
			alert("No Printer Selected");
			return;
		}

		var geometryCombined = new THREE.Geometry();

		for (var i = 0; i < editor.scene.children.length; i ++) {

			var child = editor.scene.children[i];

			if (child instanceof THREE.Mesh) {

				var mesh = child;
				mesh.updateMatrix();
				var geometry = mesh.geometry.clone();
				geometry.applyMatrix(mesh.matrix);

				if (geometry instanceof THREE.BufferGeometry) {
					geometry = new THREE.Geometry().fromBufferGeometry(geometry);
				}

				geometryCombined.merge(geometry);
			}
		}

		geometryCombined.computeBoundingBox();

		var mesh = new THREE.Mesh(geometryCombined, new THREE.MeshBasicMaterial);
		mesh.position.y = -geometryCombined.boundingBox.min.y; 

		var slicer = new D3D.SlicerWorker();

		slicer.onprogress = function (_progress) {
			progress.setValue(Math.round(_progress.procent * 100) + "%");
		};
		slicer.onfinish = function (gcode) {

			var print = new UI.Button( 'Start Print' );
			print.onClick( function () {

				doodleBox.print(gcode);

			} );
			container.add( print );

			var download = new UI.Button( 'Download GCode' );
			download.onClick( function () {

				downloadFile("gcode.gcode", gcode);

			} );
			container.add( download );

		};

		slicer.setSettings(USER_SETTINGS, PRINTER_SETTINGS[selectedPrinter]);
		slicer.setMesh(mesh);

		slicer.slice();

		slicer.close();
	} );
	container.add( slice );

	var stop = new UI.Button( 'Stop Print' );
	stop.onClick( function () {

		if (selectedPrinter === undefined) {
			alert("No Printer Selected");
			return;
		}

		doodleBox.stopPrint(printer);

	} );
	container.add( stop );


	container.add( new UI.Break() );

	(function () {
		'use strict';

		var loadedItems = 0;
		function loaded () {
			loadedItems ++;
			if (loadedItems === 2) {
				//finish loading

				settingsLoaded();

			}
		}

		$.ajax({
			url: '../../settings/user_settings.json', 
			dataType: 'json', 
			success: function (response) {
				USER_SETTINGS = response;
				loaded();
			}
		});

		$.ajax({
			url: '../../settings/printer_settings.json', 
			dataType: 'json', 
			success: function (response) {
				PRINTER_SETTINGS = response;
				loaded();
			}
		});
	})();

	return container;

}
