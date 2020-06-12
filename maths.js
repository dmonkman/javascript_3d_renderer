class Vector3D {
	constructor(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
	}
	integerize(){
		this.x = parseInt(this.x);
		this.y = parseInt(this.y);
		this.z = parseInt(this.z);
		return this;
	}
	
	equals(VectorA) {
		this.x = VectorA.x;
		this.y = VectorA.y;
		this.z = VectorA.z;
	}
	
	addAssign(VectorA){
		this.x += VectorA.x;
		this.y += VectorA.y;
		this.z += VectorA.z;
	}
	
	add(VectorA){
		return(new Vector3D(this.x+VectorA.x, this.y+VectorA.y, this.z+VectorA.z));
	}
	
	subAssign(VectorA){
		this.x -= VectorA.x;
		this.y -= VectorA.y;
		this.z -= VectorA.z;
	}
	
	sub(VectorA){
		return(new Vector3D(this.x-VectorA.x, this.y-VectorA.y, this.z-VectorA.z));
	}
	
	scaleAssign(Scalar){
		this.x *= Scalar;
		this.y *= Scalar;
		this.z *= Scalar;
		return this;
	}
	
	scale(Scalar){
		return new Vector3D(this.x* Scalar, this.y* Scalar, this.z* Scalar);
	}
	
	dotProduct(VectorA){
		return this.x*VectorA.x + this.y*VectorA.y + this.z*VectorA.z;
	}
	
	crossProduct(VectorA){
		return(new Vector3D(this.y*VectorA.z - this.z*VectorA.y, this.z*VectorA.x - this.x*VectorA.z, this.x*VectorA.y - this.y*VectorA.x));
	}
	
	normalize(){
		var length = this.length();
		this.x /= length;
		this.y /= length;
		this.z /= length;
	}
	
	length(){
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
	}
	
	rotate(angleRads, axis){
		if(angleRads != 0){	
			axis.dir.normalize();
			this.x -= axis.pos.x;
			this.y -= axis.pos.y;
			this.z -= axis.pos.z;
			var sinAngle = Math.sin(angleRads/2);
			var Q = new Quaternion(Math.cos(angleRads/2), sinAngle*axis.dir.x, sinAngle*axis.dir.y, sinAngle*axis.dir.z);
			var Qconj = Q.Qconjugate();
			Q.Vmul(this);
			Q.Qmul(Qconj);
			this.x = Q.x;
			this.y = Q.y;
			this.z = Q.z;
			this.x += axis.pos.x;
			this.y += axis.pos.y;
			this.z += axis.pos.z;
		}
		return this;
	}
}

class Axis {
	constructor(px, py, pz, vx, vy, vz){
		this.pos = new Vector3D(px, py, pz);
		this.dir = new Vector3D(vx, vy, vz);
	}
}

class Quaternion {
	constructor(w, x, y, z){
		this.w = w;
		this.x = x;
		this.y = y;
		this.z = z;
	}
	normalize(){
		var length = this.length();
		if(length != 1){
		this.w /= length;
		this.x /= length;
		this.y /= length;
		this.z /= length;
		}
	}
	length(){
		return Math.sqrt(this.w+this.w + this.x*this.x + this.y*this.y + this.z*this.z);
	}
	Vmul(VectorA){
		var w_ = - this.x*VectorA.x - this.y*VectorA.y - this.z*VectorA.z;
		var x_ = this.w*VectorA.x + this.y*VectorA.z - this.z*VectorA.y;
		var y_ = this.w*VectorA.y - this.x*VectorA.z + this.z*VectorA.x;
		var z_ = this.w*VectorA.z + this.x*VectorA.y - this.y*VectorA.x;
		this.w = w_;
		this.x = x_;
		this.y = y_;
		this.z = z_;
	}
	Qmul(QuaternionA){
		var w_ = this.w*QuaternionA.w - this.x*QuaternionA.x - this.y*QuaternionA.y - this.z*QuaternionA.z;
		var x_ = this.w*QuaternionA.x + this.x*QuaternionA.w + this.y*QuaternionA.z - this.z*QuaternionA.y;
		var y_ = this.w*QuaternionA.y - this.x*QuaternionA.z + this.y*QuaternionA.w + this.z*QuaternionA.x;
		var z_ = this.w*QuaternionA.z + this.x*QuaternionA.y - this.y*QuaternionA.x + this.z*QuaternionA.w;
		this.w = w_;
		this.x = x_;
		this.y = y_;
		this.z = z_;
	}
	Qconjugate(){
		return(new Quaternion(this.w,-this.x,-this.y,-this.z));
	}
}

class Mat4x4 {
	constructor(){
		this.m = [4][4];
		this.m = 0;
	}
}