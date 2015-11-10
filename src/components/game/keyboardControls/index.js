class KeyboardControls {

    constructor (input) {
        this.object = input.object;
        this.options = input.options || {};

        this.domElement = this.options.domElement || document;
        this.moveSpeed = this.options.moveSpeed || 0.3;
        this.turnSpeed = this.options.turnSpeed || 2;

        this.domElement.addEventListener('keydown', this.onKeyDown.bind(this), false);
        this.domElement.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    update() {
        if (this.moveForward) {
            this.object.translateZ(-this.moveSpeed);
        }

        if (this.moveBackward) {
            this.object.translateZ(this.moveSpeed / 3);
        }

        if (this.turnLeft) {
            this.object.rotation.y += this.turnSpeed * Math.PI / 180;
        }

        if (this.turnRight) {
            this.object.rotation.y -= this.turnSpeed * Math.PI / 180;
        }
    }

    setDirection (input) {
        const keyCode = input.keyCode;
        const enable = input.enable;

        switch (keyCode) {
            case 38: // up arrow
            case 87: // W
                this.moveForward = enable;
                break;

            case 40: // down arrow
            case 83: // S
                this.moveBackward = enable;
                break;

            case 37: // left arrow
            case 65: // A
                this.turnLeft = enable;
                break;

            case 39: // right arrow
            case 68: // D
                this.turnRight = enable;
                break;
        }
    }

    onKeyDown (e) {
        this.setDirection({
            keyCode: e.keyCode,
            enable: true
        });
    }

    onKeyUp (e) {
        this.setDirection({
            keyCode: e.keyCode,
            enable: false
        });
    }

};

module.exports = KeyboardControls;
