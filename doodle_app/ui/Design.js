/**
 * @author mrdoob / http://mrdoob.com/
 */

var Design = function ( editor ) {

	var signals = editor.signals;

	var container = new UI.Panel();
	container.setId( 'Design' );
	container.setPosition( 'absolute' );
	container.setWidth( '50%' );
	container.setTop( '0px' );
	container.setLeft( '0px' );
	container.setBottom( '0px' );

	var drawCanvas = new DrawCanvas(editor.scene);

	container.dom.appendChild(drawCanvas.domElement);


	signals.windowResize.add( function () {

		drawCanvas.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

	} );

	return container;

}
