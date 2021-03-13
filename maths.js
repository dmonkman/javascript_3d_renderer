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
			axis.direction.normalize();
			this.x -= axis.position.x;
			this.y -= axis.position.y;
			this.z -= axis.position.z;
			var sinAngle = Math.sin(angleRads/2);
			var Q = new Quaternion(Math.cos(angleRads/2), sinAngle*axis.direction.x, sinAngle*axis.direction.y, sinAngle*axis.direction.z);
			var Qconj = Q.Qconjugate();
			Q.Vmul(this);
			Q.Qmul(Qconj);
			this.x = Q.x;
			this.y = Q.y;
			this.z = Q.z;
			this.x += axis.position.x;
			this.y += axis.position.y;
			this.z += axis.position.z;
		}
		return this;
	}

	rotate_origin(angleRads, v){
		// Rotate about a vector pointing from the origin
		if(angleRads != 0){	
			v.normalize();
			var sinAngle = Math.sin(angleRads/2);
			var Q = new Quaternion(Math.cos(angleRads/2), sinAngle*v.x, sinAngle*v.y, sinAngle*v.z);
			var Qconj = Q.Qconjugate();
			Q.Vmul(this);
			Q.Qmul(Qconj);
			this.x = Q.x;
			this.y = Q.y;
			this.z = Q.z;
		}
		return this;
	}

	matMul(m) {
		v = new Vector3D();
		v.x = i.x * m.m[0][0] + i.y * m.m[1][0] + i.z * m.m[2][0] + i.w * m.m[3][0];
		v.y = i.x * m.m[0][1] + i.y * m.m[1][1] + i.z * m.m[2][1] + i.w * m.m[3][1];
		v.z = i.x * m.m[0][2] + i.y * m.m[1][2] + i.z * m.m[2][2] + i.w * m.m[3][2];
		v.w = i.x * m.m[0][3] + i.y * m.m[1][3] + i.z * m.m[2][3] + i.w * m.m[3][3];
		return v;
	}

	matMulAssign(m) {
		this.x = i.x * m.m[0][0] + i.y * m.m[1][0] + i.z * m.m[2][0] + i.w * m.m[3][0];
		this.y = i.x * m.m[0][1] + i.y * m.m[1][1] + i.z * m.m[2][1] + i.w * m.m[3][1];
		this.z = i.x * m.m[0][2] + i.y * m.m[1][2] + i.z * m.m[2][2] + i.w * m.m[3][2];
		this.w = i.x * m.m[0][3] + i.y * m.m[1][3] + i.z * m.m[2][3] + i.w * m.m[3][3];
	}
}

class Mat4x4 {
	constructor(){
		this.m = new Array();
		for(var i = 0; i < 4; i++){
			this.m[i] = [];
		}
	}
}

class Axis {
	constructor(px, py, pz, vx, vy, vz){
		this.position = new Vector3D(px, py, pz);
		this.direction = new Vector3D(vx, vy, vz);
	}
}

class Quaternion {
	constructor(w=1, x=0, y=0, z=0){
		this.w = w;
		this.x = x;
		this.y = y;
		this.z = z;
	}
	set(theta, v){
		v.scale(Math.sin(theta/2))
		this.w = Math.cos(theta/2)
		this.x = v.x
		this.y = v.y
		this.z = v.z
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


// STANDALONE ALGEBRA FUNCTIONS
function Matrix_MultiplyVector(m, i)
{
    var v = new Vector3D();
    v.x = i.x * m.m[0][0] + i.y * m.m[1][0] + i.z * m.m[2][0] + i.w * m.m[3][0];
    v.y = i.x * m.m[0][1] + i.y * m.m[1][1] + i.z * m.m[2][1] + i.w * m.m[3][1];
    v.z = i.x * m.m[0][2] + i.y * m.m[1][2] + i.z * m.m[2][2] + i.w * m.m[3][2];
    v.w = i.x * m.m[0][3] + i.y * m.m[1][3] + i.z * m.m[2][3] + i.w * m.m[3][3];
    return v;
}

function Matrix_MultiplyMatrix(m1, m2)
{
    var matrix = new Mat4x4();
    for (var c = 0; c < 4; c++)
        for (var r = 0; r < 4; r++)
            matrix.m[r][c] = m1.m[r][0] * m2.m[0][c] + m1.m[r][1] * m2.m[1][c] + m1.m[r][2] * m2.m[2][c] + m1.m[r][3] * m2.m[3][c];
    return matrix;
}

function Quaternion_Mul_Q(q1, q2){
	var w_ = q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z;
	var x_ = q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y;
	var y_ = q1.w*q2.y - q1.x*q2.z + q1.y*q2.w + q1.z*q2.x;
	var z_ = q1.w*q2.z + q1.x*q2.y - q1.y*q2.x + q1.z*q2.w;
	return new Quaternion(w_, x_, y_, z_)
}

function Quaternion_Mul_V(q, v){
	var w_ = -q.x*v.x - q.y*v.y - q.z*v.z;
	var x_ = q.w*v.x + q.y*v.z - q.z*v.y;
	var y_ = q.w*v.y - q.x*v.z + q.z*v.x;
	var z_ = q.w*v.z + q.x*v.y - q.y*v.x;
	return new Quaternion(w_, x_, y_, z_)
}

function Quaternion_Mul_Q_V(q1, q2){
	//var w_ = q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z;
	var x_ = q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y;
	var y_ = q1.w*q2.y - q1.x*q2.z + q1.y*q2.w + q1.z*q2.x;
	var z_ = q1.w*q2.z + q1.x*q2.y - q1.y*q2.x + q1.z*q2.w;
	return new Vector3D(x_, y_, z_)
}

function Vector_Add(v1, v2)
{
    return new Vector3D(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

function Vector_Sub(v1, v2)
{
    return new Vector3D(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

function Vector_Scale(v1, k)
{
    return new Vector3D(v1.x * k, v1.y * k, v1.z * k );
}

function Vector_Div(v1, k)
{
    return new Vector3D(v1.x / k, v1.y / k, v1.z / k );
}

function Vector_DotProduct(v1, v2)
{
    return v1.x*v2.x + v1.y*v2.y + v1.z * v2.z;
}

function Vector_Length(v)
{
    return Math.sqrt(Vector_DotProduct(v, v));
}

function Vector_Normalize(v)
{
    l = Vector_Length(v);
    return new Vector3D(v.x / l, v.y / l, v.z / l );
}

function Vector_CrossProduct(v1, v2)
{
    v = new Vector3D();
    v.x = v1.y * v2.z - v1.z * v2.y;
    v.y = v1.z * v2.x - v1.x * v2.z;
    v.z = v1.x * v2.y - v1.y * v2.x;
    return v;
}

function Vector_IntersectPlane(plane_p, plane_n, lineStart, lineEnd)
{
    var plane_n = Vector_Normalize(plane_n);
    var plane_d = -Vector_DotProduct(plane_n, plane_p);
    var ad = Vector_DotProduct(lineStart, plane_n);
    var bd = Vector_DotProduct(lineEnd, plane_n);
    var t = (-plane_d - ad) / (bd - ad);
    lineStartToEnd = Vector_Sub(lineEnd, lineStart);
    lineToIntersect = Vector_Scale(lineStartToEnd, t);
    return Vector_Add(lineStart, lineToIntersect);
}