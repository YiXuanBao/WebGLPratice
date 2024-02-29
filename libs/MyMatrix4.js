class MyMatrix4 {
    constructor(opt_src) {
        var i, s, d;
        if (opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
            s = opt_src.elements;
            d = new Float32Array(16);
            for (i = 0; i < 16; ++i) {
                d[i] = s[i];
            }
            this.elements = d;
        } else {
            this.elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        }
    }
    setLookAt(eyeX, eyeY, eyeZ, targetX, targetY, targetZ, upX, upY, upZ) {
        var nzX, nzY, nzZ;
        nzX = targetX - eyeX;
        nzY = targetY - eyeY;
        nzZ = targetZ - eyeZ;

        // 求出-z轴
        var normalNZ = 1 / Math.sqrt(nzX * nzX + nzY * nzY + nzZ * nzZ);
        nzX *= normalNZ;
        nzY *= normalNZ;
        nzZ *= normalNZ;

        // 叉乘求出x轴
        var xX, xY, xZ;
        xX = nzY * upZ - nzZ * upY;
        xY = nzZ * upX - nzX * upZ;
        xZ = nzX * upY - nzY * upX;

        var normalizeX = 1 / Math.sqrt(xX * xX + xY * xY + xZ * xZ);
        xX *= normalizeX;
        xY *= normalizeX;
        xZ *= normalizeX;

        // x和-z叉乘求出y轴
        var yX, yY, yZ;
        yX = xY * nzZ - xZ * nzY;
        yY = xZ * nzX - xX * nzZ;
        yZ = xX * nzY - xY * nzX;

        var e = this.elements;
        e[0] = xX;
        e[1] = yX;
        e[2] = -nzX;
        e[3] = 0;

        e[4] = xY;
        e[5] = yY;
        e[6] = -nzY;
        e[7] = 0;

        e[8] = xZ;
        e[9] = yZ;
        e[10] = -nzZ;
        e[11] = 0;

        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;

        return this.translate(-eyeX, -eyeY, -eyeZ);
    }

    lookAt(eyeX, eyeY, eyeZ, targetX, targetY, targetZ, upX, upY, upZ) {
        return this.concat(new MyMatrix4().setLookAt(eyeX, eyeY, eyeZ, targetX, targetY, targetZ, upX, upY, upZ));
    }

    // 设置为平移矩阵
    setTranslate(x, y, z) {
        var e = this.elements;
        e[0] = 1;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;

        e[4] = 0;
        e[5] = 1;
        e[6] = 0;
        e[7] = 0;

        e[8] = 0;
        e[9] = 0;
        e[10] = 1;
        e[11] = 0;

        e[12] = x;
        e[13] = y;
        e[14] = z;
        e[15] = 1;

        return this;
    }

    // 平移后的矩阵
    translate(x, y, z) {
        var e = this.elements;
        e[12] += x * e[0] + y * e[4] + z * e[8];
        e[13] += x * e[1] + y * e[5] + z * e[9];
        e[14] += x * e[2] + y * e[6] + z * e[10];
        e[15] += x * e[3] + y * e[7] + z * e[11];
        return this;
    }
    //设置为旋转矩阵
    setRotate(angle, axisX, axisY, axisZ) {
        angle = Math.PI * angle / 180;
        var e = this.elements;
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        //绕x轴旋转
        if (axisX !== 0 && axisY === 0 && axisZ === 0) {
            // -x轴,旋转方向反过来 sin(-a) = -sina, cos(-a) = cosa
            if (axisX < 0) {
                sin = -sin;
            }
            e[0] = 1; e[1] = 0; e[2] = 0; e[3] = 0;
            e[4] = 0; e[5] = cos; e[6] = sin; e[7] = 0;
            e[8] = 0; e[9] = -sin; e[10] = cos; e[11] = 0;
            e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        }
        // 绕y轴旋转
        else if (axisX === 0 && axisY !== 0 && axisZ === 0) {
            // -y轴
            if (axisY < 0) {
                sin = -sin;
            }
            e[0] = cos; e[1] = 0; e[2] = -sin; e[3] = 0;
            e[4] = 0; e[5] = 1; e[6] = 0; e[7] = 0;
            e[8] = sin; e[9] = 0; e[10] = cos; e[11] = 0;
            e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        }
        // 绕z轴旋转
        else if (axisX === 0 && axisY === 0 && axisZ !== 0) {
            // -z轴
            if (axisZ < 0) {
                sin = -sin;
            }
            e[0] = cos; e[1] = sin; e[2] = 0; e[3] = 0;
            e[4] = -sin; e[5] = cos; e[6] = 0; e[7] = 0;
            e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0;
            e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        }
        else {
            var len = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ);
            if (len !== 1) {
                var rLen = 1 / len;
                axisX *= rLen;
                axisY *= rLen;
                axisZ *= rLen;
            }

            var nCos = 1 - cos;
            e[0] = cos + axisX * axisX * nCos;
            e[1] = axisX * axisY * nCos + axisZ * sin;
            e[2] = axisZ * axisX * nCos - axisY * sin;
            e[3] = 0;
            e[4] = axisX * axisY * nCos - axisZ * sin;
            e[5] = cos + axisY * axisY * nCos;
            e[6] = axisZ * axisY * nCos + axisX * sin;
            e[7] = 0;
            e[8] = axisX * axisZ * nCos + axisY * sin;
            e[9] = axisY * axisZ * nCos - axisX * sin;
            e[10] = cos + axisZ * axisZ * nCos;
            e[11] = 0;
            e[12] = 0;
            e[13] = 0;
            e[14] = 0;
            e[15] = 1;
        }

        return this;
    }
    // 旋转矩阵
    rotate(angle, axisX, axisY, axisZ) {
        return this.concat(new MyMatrix4().setRotate(angle, axisX, axisY, axisZ))
    }

    setScale(x, y, z) {
        var e = this.elements;
        e[0] = x;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;

        e[4] = 0;
        e[5] = y;
        e[6] = 0;
        e[7] = 0;

        e[8] = 0;
        e[9] = 0;
        e[10] = z;
        e[11] = 0;

        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;

        return this;
    }

    scale(x, y, z) {
        var e = this.elements;
        e[0] *= x;
        e[1] *= x;
        e[2] *= x;
        e[3] *= x;
        e[4] *= y;
        e[5] *= y;
        e[6] *= y;
        e[7] *= y;
        e[8] *= z;
        e[9] *= z;
        e[10] *= z;
        e[11] *= z;
        return this;
    }

    /**
     * Multiply the matrix from the right.
     * @param other The multiply matrix
     * @return this
     */
    concat(other) {
        var i, e, a, b, ai0, ai1, ai2, ai3;

        // Calculate e = a * b
        e = this.elements;
        a = this.elements;
        b = other.elements;

        // If e equals b, copy b to temporary matrix.
        if (e === b) {
            b = new Float32Array(16);
            for (i = 0; i < 16; ++i) {
                b[i] = e[i];
            }
        }

        for (i = 0; i < 4; i++) {
            ai0 = a[i]; ai1 = a[i + 4]; ai2 = a[i + 8]; ai3 = a[i + 12];
            e[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
            e[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
            e[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
            e[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
        }

        return this;
    };

    multiply = this.concat;

    setOrtho(l, r, b, t, n, f) {
        var e = this.elements;

        var rw = 1 / (r - l);
        var rh = 1 / (t - b);
        var rd = 1 / (f - n);

        e[0] = 2 * rw; e[4] = 0; e[8] = 0; e[12] = -(l + r) * rw;
        e[1] = 0; e[5] = 2 * rh; e[9] = 0; e[13] = -(b + t) * rh;
        e[2] = 0; e[6] = 0; e[10] = -2 * rd; e[14] = -(f + n) * rd;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;

        return this;
    }

    setPerspective(fovY, aspect, n, f) {
        fovY = fovY * Math.PI / 180.0;
        var t = n * Math.tan(fovY / 2);
        var b = -t;
        var r = t * aspect;
        var l = -r;

        var rw = 1 / (r - l);
        var rh = 1 / (t - b);
        var rd = 1 / (f - n);

        var e = this.elements;
        e[0] = 2 * n * rw; e[4] = 0; e[8] = 0; e[12] = 0;
        e[1] = 0; e[5] = 2 * n * rh; e[9] = 0; e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = -(f + n) * rd; e[14] = -2 * f * n * rd;
        e[3] = 0; e[7] = 0; e[11] = -1; e[15] = 0;

        return this;
    }

    // 当前矩阵设置为src矩阵
    set(src) {
        var i, s, d;

        s = src.elements;
        d = this.elements;

        if (s === d) {
            return;
        }

        for (i = 0; i < 16; ++i) {
            d[i] = s[i];
        }

        return this;
    };

    //转置自身矩阵
    transpose() {
        var e, t;

        e = this.elements;

        t = e[1];
        e[1] = e[4];
        e[4] = t;
        t = e[2];
        e[2] = e[8];
        e[8] = t;
        t = e[3];
        e[3] = e[12];
        e[12] = t;
        t = e[6];
        e[6] = e[9];
        e[9] = t;
        t = e[7];
        e[7] = e[13];
        e[13] = t;
        t = e[11];
        e[11] = e[14];
        e[14] = t;

        return this;
    };

    // 将自身设置为other的逆矩阵
    setInverseOf(other) {
        var i, s, d, inv, det;

        s = other.elements;
        d = this.elements;
        inv = new Float32Array(16);

        inv[0] = s[5] * s[10] * s[15] - s[5] * s[11] * s[14] - s[9] * s[6] * s[15] +
            s[9] * s[7] * s[14] + s[13] * s[6] * s[11] - s[13] * s[7] * s[10];
        inv[4] = -s[4] * s[10] * s[15] + s[4] * s[11] * s[14] + s[8] * s[6] * s[15] -
            s[8] * s[7] * s[14] - s[12] * s[6] * s[11] + s[12] * s[7] * s[10];
        inv[8] = s[4] * s[9] * s[15] - s[4] * s[11] * s[13] - s[8] * s[5] * s[15] +
            s[8] * s[7] * s[13] + s[12] * s[5] * s[11] - s[12] * s[7] * s[9];
        inv[12] = -s[4] * s[9] * s[14] + s[4] * s[10] * s[13] + s[8] * s[5] * s[14] -
            s[8] * s[6] * s[13] - s[12] * s[5] * s[10] + s[12] * s[6] * s[9];

        inv[1] = -s[1] * s[10] * s[15] + s[1] * s[11] * s[14] + s[9] * s[2] * s[15] -
            s[9] * s[3] * s[14] - s[13] * s[2] * s[11] + s[13] * s[3] * s[10];
        inv[5] = s[0] * s[10] * s[15] - s[0] * s[11] * s[14] - s[8] * s[2] * s[15] +
            s[8] * s[3] * s[14] + s[12] * s[2] * s[11] - s[12] * s[3] * s[10];
        inv[9] = -s[0] * s[9] * s[15] + s[0] * s[11] * s[13] + s[8] * s[1] * s[15] -
            s[8] * s[3] * s[13] - s[12] * s[1] * s[11] + s[12] * s[3] * s[9];
        inv[13] = s[0] * s[9] * s[14] - s[0] * s[10] * s[13] - s[8] * s[1] * s[14] +
            s[8] * s[2] * s[13] + s[12] * s[1] * s[10] - s[12] * s[2] * s[9];

        inv[2] = s[1] * s[6] * s[15] - s[1] * s[7] * s[14] - s[5] * s[2] * s[15] +
            s[5] * s[3] * s[14] + s[13] * s[2] * s[7] - s[13] * s[3] * s[6];
        inv[6] = -s[0] * s[6] * s[15] + s[0] * s[7] * s[14] + s[4] * s[2] * s[15] -
            s[4] * s[3] * s[14] - s[12] * s[2] * s[7] + s[12] * s[3] * s[6];
        inv[10] = s[0] * s[5] * s[15] - s[0] * s[7] * s[13] - s[4] * s[1] * s[15] +
            s[4] * s[3] * s[13] + s[12] * s[1] * s[7] - s[12] * s[3] * s[5];
        inv[14] = -s[0] * s[5] * s[14] + s[0] * s[6] * s[13] + s[4] * s[1] * s[14] -
            s[4] * s[2] * s[13] - s[12] * s[1] * s[6] + s[12] * s[2] * s[5];

        inv[3] = -s[1] * s[6] * s[11] + s[1] * s[7] * s[10] + s[5] * s[2] * s[11] -
            s[5] * s[3] * s[10] - s[9] * s[2] * s[7] + s[9] * s[3] * s[6];
        inv[7] = s[0] * s[6] * s[11] - s[0] * s[7] * s[10] - s[4] * s[2] * s[11] +
            s[4] * s[3] * s[10] + s[8] * s[2] * s[7] - s[8] * s[3] * s[6];
        inv[11] = -s[0] * s[5] * s[11] + s[0] * s[7] * s[9] + s[4] * s[1] * s[11] -
            s[4] * s[3] * s[9] - s[8] * s[1] * s[7] + s[8] * s[3] * s[5];
        inv[15] = s[0] * s[5] * s[10] - s[0] * s[6] * s[9] - s[4] * s[1] * s[10] +
            s[4] * s[2] * s[9] + s[8] * s[1] * s[6] - s[8] * s[2] * s[5];

        det = s[0] * inv[0] + s[1] * inv[4] + s[2] * inv[8] + s[3] * inv[12];
        if (det === 0) {
            return this;
        }

        det = 1 / det;
        for (i = 0; i < 16; i++) {
            d[i] = inv[i] * det;
        }

        return this;
    };

    // 矩阵初始化
    setIdentity() {
        var e = this.elements;
        e[0] = 1;
        e[4] = 0;
        e[8] = 0;
        e[12] = 0;
        e[1] = 0;
        e[5] = 1;
        e[9] = 0;
        e[13] = 0;
        e[2] = 0;
        e[6] = 0;
        e[10] = 1;
        e[14] = 0;
        e[3] = 0;
        e[7] = 0;
        e[11] = 0;
        e[15] = 1;
        return this;
    };
}