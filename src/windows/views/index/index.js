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
                details: [],
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
            avatarPreview:'',
            avatarFile: null,
            avatarChangeIndex: 0
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
        },
        footerTitle() {
            switch (this.step) {
                case '1':
                    return '初始界面';
                    break;
                case 'A':
                    return '名册列表';
                    break;
                case 'B':
                    return '导入名册';
                    break;
                case 'B1':
                    return '选择方式';
                    break;
                case 'B2':
                    return '请为你的名册命名';
                    break;
                case '2':
                    return '名册详情';
                    break;
            }
        }
    },
    filters: {},
    methods: {
        /*        readNameList() {
                    const classDataPath = path.join(__dirname, '../../../data', 'zhiyao3', 'data.json');
                    let classData = fs.readFileSync(classDataPath, {
                        encoding: 'utf-8'
                    });
                    classData = JSON.parse(classData);
                    this.classData = classData;
                },*/
        toggleRoll() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            } else {
                this.timer = setInterval(() => {
                    this.activeIndex = this.activeIndex + 1 > this.rollNameList.length - 1 ? 0 : this.activeIndex + 1;
                }, 45)
            }
        },
        toggleSelect(index) {
            if (this.timer) {
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
            let length = Object.keys(worksheet).length - 4;

            for (let i = 2; i < length - 1; i++) {
                const name = worksheet[`A${i}`].h;
                const id = worksheet[`B${i}`].h;
                let student = {
                    name,
                    id,
                    isExcluded: false,
                    avatar: `https://api.adorable.io/avatars/${id}.png`
                };
                details.push(student)
            }
            jsonData.fileDir = fileDir;
            jsonData.createdAt = time;
            jsonData.updatedAt = time;
            jsonData.details = details;

            this.jsonData = jsonData;
            console.log(jsonData);

        },
        onSelectXlsxFile(e) {
            const file = e.target.files[0];
            if(!/\.xlsx$/.test(file.name)){
                alert('请选择excel文件进行导入');
                return;
            }
            this.readXlsxFile(file);
            this.prevStep = this.step;
            this.step = 'B2';
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
            if (this.prevStep === 'B2') {
                this.prevStep = 'B'
            }
            this.step = 'A';
            this.readExistNameList();
        },
        openImportDataWay() {
            this.prevStep = this.step;
            this.step = 'B';
        },
        goBack() {
            const step = this.step;
            this.step = this.prevStep;
            this.prevStep = step;
        },
        openNameList() {
            const activeIndex = this.existClassData.activeIndex;
            this.classData = this.existClassData.result[activeIndex];
            this.step = '2';
        },
        confirmImport(e) {
            e.preventDefault();
            const nameListName = this.nameListName.trim();
            if (!nameListName) {
                alert('不能为空');
                return;
            }
            this.jsonData.name = nameListName;
            this.writeJSONData();
        },
        openChangeAvatar(index){
            this.avatarChangeIndex = index;
            this.step = 'C'
        },
        readAvatarImage(e){
            const file = e.target.files[0];
            const fileName = file.name;
            if(!/\.(jpg|png|gif)$/.test(fileName)){
                alert('请选择图片文件');
                return;
            }
            console.log(file)
            const fileReader = new FileReader();
            fileReader.onload = function(e){
               this.avatarPreview = e.target.result;
               this.avatarFile = file;
            }.bind(this);
            fileReader.readAsDataURL(file);
        },
        async uploadImage(file){
            const filePath = file.path;
            const fileName = `${Date.now()}-${file.name}`;
            const avatarPath = `../../../assets/imgs/${fileName}`;
            await fs.createReadStream(filePath).pipe(fs.createWriteStream(path.join(__dirname, '../../../assets/imgs', fileName)));
            this.classData.details[this.avatarChangeIndex].avatar = avatarPath;
            this.step = '2'
        },

        confirmChangeAvatar(e){
            e.preventDefault();
            this.uploadImage(this.avatarFile);

        }
    },
    mounted() {
        // this.readNameList()
        // this.readExistNameList()
    }
});