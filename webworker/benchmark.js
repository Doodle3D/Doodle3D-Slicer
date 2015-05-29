self.addEventListener("message", function (event) {
	"use strict";

	//console.log(event.data);

	if (event.data === "close") {
		self.close();
	}
});