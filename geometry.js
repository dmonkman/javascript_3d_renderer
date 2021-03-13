class Mesh {
	constructor() {
		this.vertices = [];
		this.faces = [];
	}
}

// Construct a triange in 3d space
class Triangle {
	constructor(x1=0, y1=0, z1=0, x2=0, y2=0, z2=0, x3=0, y3=0, z3=0, color='rgb('+
	Math.floor(Math.random()*256)+','+
	Math.floor(Math.random()*256)+','+
	Math.floor(Math.random()*256)+')') {
		this.color = color;
		this.vert = [new Vector3D(x1, y1, z1), new Vector3D(x2, y2, z2), new Vector3D(x3, y3, z3)];
		this.normalize();
		this.midpointcalc();
		this.depth = (z1 + z2 + z3)/3
	}
	normalize() {
		this.normal = (this.vert[1].sub(this.vert[0])).crossProduct(this.vert[2].sub(this.vert[0]));
	}
	midpointcalc(){
		var midp01 = this.vert[0].add(this.vert[1].sub(this.vert[0]).scale(0.5));
		//this.midpoint = this.vert[0];
		this.midpoint = midp01.add(this.vert[2].sub(midp01).scale(0.5));
	}
}