const sortClasses = () => {
	let selElem = document.getElementById("class_selector");
	let tmpAry = [];
	for (let i = 0; i < selElem.options.length; i++) {
		tmpAry[i] = [];
		tmpAry[i][0] = selElem.options[i].text;
		tmpAry[i][1] = selElem.options[i].value;
		tmpAry[i][2] = selElem.options[i].selected;
	}
	tmpAry.sort();
	while (selElem.options.length > 0) {
		selElem.options[0] = null;
	}
	for (let i = 0; i < tmpAry.length; i++) {
		let op = new Option(tmpAry[i][0], tmpAry[i][1]);
		op.selected = tmpAry[i][2];
		selElem.options[i] = op;
	}
}