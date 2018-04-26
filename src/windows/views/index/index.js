const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const moment = require('moment');

moment.locale('zh-cn');

const app = new Vue({
    el: '#app',
    data() {
        return {
            classData: {
                details: []
            },
            activeIndex: 0,
            timer: null,
            searchTxt: '',
            jsonData: null,
            existClassData: {
                activeIndex: 0,
                result: []
            },
            prevStep: '1',
            step: '1',
            nameListName: '',
            nameListName1: '',
            avatarPreview: '',
            avatarFile: null,
            avatarChangeIndex: 0,
            studentsForm: []
        }
    },
    computed: {
        // 抽取列表
        rollNameList() {
            return this.classData.details.filter((student) => {
                return student.isExcluded === false
            })
        },
        // 侧边栏列表
        nameList() {
            const searchTxt = this.searchTxt.trim();
            return this.classData.details.filter((student) => {
                return student.name.indexOf(searchTxt) !== -1 || String(student.id).indexOf(searchTxt) !== -1
            })
        }
    },
    filters: {},
    methods: {
        toggleRoll() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            } else {
                this.timer = setInterval(() => {
                    this.activeIndex = this.activeIndex + 1 > this.rollNameList.length - 1 ? 0 : this.activeIndex + 1;
                }, 100)
            }
        },
        toggleSelect(index) {
            if (this.timer || this.step=== 'E') {
                return;
            }
            let isExcluded = this.classData.details[index].isExcluded;
            if (!isExcluded && this.rollNameList.length === 1) {
                return;
            }
            if (index === this.activeIndex) {
                this.activeIndex = 0;
            }
            console.log(index, isExcluded)
            this.classData.details[index].isExcluded = !isExcluded;
        },
        readXlsxFile(file) {
            const filePath = file.path;
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            const worksheet = workbook.Sheets[sheetNames[0]];
            const fileDir = Date.now().toString();
            const time = moment().format('LLL');
            let jsonData = {};
            let details = [];
            let length = (Object.keys(worksheet).length - 2) / 2;
            console.log(length,worksheet)
            try{
                for (let i = 2; i <= length; i++) {
                    const name = worksheet[`A${i}`].h;
                    const id = worksheet[`B${i}`].h;
                    let student = {
                        name,
                        id,
                        isExcluded: false,
                        avatar: `../../../assets/imgs/default_avatar.jpg`
                    };
                    details.push(student)
                }
                jsonData.fileDir = fileDir;
                jsonData.createdAt = time;
                jsonData.updatedAt = time;
                jsonData.details = details;

                this.jsonData = jsonData;
            }catch (e) {
                console.log(e)
                alert('导入失败，请检测excel格式是否正确')
            }
        },
        onSelectXlsxFile(e) {
            const file = e.target.files[0];
            if (!/\.xlsx$/.test(file.name)) {
                alert('请选择excel文件进行导入');
                return;
            }
            this.readXlsxFile(file);
            this.prevStep = this.step;
            this.step = 'B';
        },
        writeJSONData() {
            const descPath = path.join(__dirname, '../../../data', this.jsonData.fileDir);
            const fileName = path.join(descPath, 'data.json');
            const jsonData = JSON.stringify(this.jsonData);
            fs.mkdirSync(descPath);
            try {
                fs.writeFileSync(fileName, jsonData);
                this.openExistClassData();
            } catch (e) {
                console.log(e)
                alert('导入失败')
            }
        },
        readExistNameList() {
            const dirPath = path.join(__dirname, '../../../data');
            const dirArr = fs.readdirSync(dirPath);
            let existClassData = [];
            dirArr.forEach(dirName => {
                try {
                    let jsonData = fs.readFileSync(path.join(dirPath, dirName, 'data.json'), {
                        encoding: 'utf-8'
                    });
                    if (jsonData) {
                        jsonData = JSON.parse(jsonData);
                        existClassData.push(jsonData)
                    }
                } catch (e) {
                    console.log(e)
                }
            });
            this.existClassData.activeIndex = 0;
            this.existClassData.result = existClassData;
            console.log(existClassData);
        },
        changeClassSelect(index) {
            this.existClassData.activeIndex = index;
        },
        openExistClassData() {
            this.prevStep = this.step;
            if (this.prevStep === 'B') {
                this.prevStep = '1'
            }
            this.step = 'A';
            this.readExistNameList();
        },
        openImportDataWay() {
            this.prevStep = this.step;
            this.step = 'B';
        },
        goBack(step) {
            const stepTemp = this.step;
            if(typeof step === 'string'){
                this.step = step;
            }else{
                this.step = this.prevStep;
            }
            this.prevStep = stepTemp;
        },
        openNameList() {
            const activeIndex = this.existClassData.activeIndex;
            this.classData = this.existClassData.result[activeIndex];
            this.step = '2';
        },
        confirmImportNaming(e) {
            e.preventDefault();
            const nameListName = this.nameListName.trim();
            if (!nameListName) {
                alert('不能为空');
                return;
            }
            this.jsonData.name = nameListName;
            this.writeJSONData();
        },
        async confirmManualNaming(e) {
            e.preventDefault();
            const nameListName = this.nameListName1.trim();
            if (!nameListName) {
                alert('不能为空');
                return;
            }
            const now = Date.now();
            const fileDir = String(now);
            const time = moment(now).format('LLL');
            let details = [];
            this.studentsForm.forEach(student => {
                if (!student.avatarFile) {
                    details.push({
                        name: student.name,
                        id: student.id,
                        isExcluded: false,
                        avatar: student.avatar = '../../../assets/imgs/default_avatar.jpg'
                    })
                } else {
                    this.uploadImage(student.avatarFile, (writeStream, avatarPath) => {
                        details.push({
                            name: student.name,
                            id: student.id,
                            isExcluded: false,
                            avatar: avatarPath,
                        })
                    });
                }
            });
            let jsonData = {
                name: nameListName,
                fileDir: fileDir,
                createdAt: time,
                updatedAt: time,
                details: details
            };
            const descPath = path.join(__dirname, '../../../data', fileDir);
            const fileName = path.join(descPath, 'data.json');
            jsonData = JSON.stringify(jsonData);
            fs.mkdirSync(descPath);
            try {
                fs.writeFileSync(fileName, jsonData);
                this.openExistClassData();
            } catch (e) {
                console.log(e)
                alert('写入失败')
            }
        },
        openChangeAvatar(index,e) {
            e.stopPropagation();
            this.avatarChangeIndex = index;
            this.step = 'E'
        },
        readAvatarImage(e) {
            const file = e.target.files[0];
            const fileName = file.name;
            if (!/\.(jpg|png|gif)$/i.test(fileName)) {
                alert('请选择图片文件');
                return;
            }
            console.log(file)
            const fileReader = new FileReader();
            fileReader.onload = function (e) {
                this.avatarPreview = e.target.result;
                this.avatarFile = file;
            }.bind(this);
            fileReader.readAsDataURL(file);
        },
        uploadImage(file, cb) {
            const filePath = file.path;
            const fileName = `${Date.now()}-${file.name}`;
            const avatarPath = `../../../assets/imgs/${fileName}`;
            const readStream = fs.createReadStream(filePath);
            const writeStrem = fs.createWriteStream(path.join(__dirname, '../../../assets/imgs', fileName));
            readStream.pipe(writeStrem);
            cb && cb(writeStrem, avatarPath)
        },
        changeJSONData() {
            const fileDir = this.classData.fileDir;
            const dirPath = path.join(__dirname, '../../../data', fileDir);
            const filePath = path.join(dirPath, 'data.json');
            let jsonData = JSON.stringify(this.classData);
            try {
                fs.unlinkSync(filePath);
                fs.writeFileSync(filePath, jsonData)
            } catch (e) {
                console.log(e)
            }
        },
        confirmChangeAvatar(e) {
            e.preventDefault();
            this.uploadImage(this.avatarFile, (writeStream, avatarPath) => {
                writeStrem.on('close', () => {
                    this.classData.details[this.avatarChangeIndex].avatar = avatarPath;
                    this.changeJSONData();
                    this.step = '2'
                })
            });
        },
        /**
         * 图片加载错误时使用默认图片
         * @param index
         */
        onImageError(index) {
            this.classData.details[index].avatar = `../../../assets/imgs/default_avatar.jpg`
        },
        deleteNameList() {
            const activeIndex = this.existClassData.activeIndex;
            const fileDir = this.existClassData.result[activeIndex].fileDir;
            const dirPath = path.join(__dirname, '../../../data', fileDir);
            const filePath = path.join(dirPath, 'data.json');
            try {
                fs.unlinkSync(filePath);
                fs.rmdirSync(dirPath);
                this.existClassData.result.splice(activeIndex, 1)
            } catch (e) {
                console.log(e)
            }
        },
        openManualPage() {
            this.prevStep = this.step;
            this.step = 'C'
        },
        addStudentItem() {
            this.studentsForm.push({
                name: '',
                id: '',
                avatarFile: null
            })
        },
        chooseAvatar(index, e) {
            const file = e.target.files[0];
            const fileName = file.name;
            if (!/\.(jpg|png|gif)$/i.test(fileName)) {
                alert('请选择图片文件');
                return;
            }
            this.studentsForm[index].avatarFile = file;
        },
        confirmManualData() {
            this.prevStep = this.step;
            this.step = 'C1'
        }
    },
    mounted() {
    }
});