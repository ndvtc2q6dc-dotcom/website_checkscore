// 全局变量
var screeningData = [];
var scoreData = [];
var recommendationData = [];
var remainingData = [];
var filteredScreeningData = [];
var filteredScoreData = [];
var currentScreeningPage = 1;
var currentScorePage = 1;
var currentAnalysisPage = 1;
var currentWaitingPage = 1;
var itemsPerPage = 20;

// 分析模块变量
var analysisData = [];
var analysisReport = {};

// 等待裁定扣分数据
var waitingData = [];

// 管理员登录功能
var isAdmin = false;

// ========== 通用函数 ==========

// 防抖函数 - 兼容低版本浏览器
function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
        var args = arguments;
        var that = this;
        var later = function() {
            clearTimeout(timeout);
            func.apply(that, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 初始化拼音转换对象
var pinyin = null;

// 初始化拼音转换器（在页面加载完成后初始化）
function initPinyin() {
    try {
        if (typeof Pinyin !== 'undefined') {
            pinyin = new Pinyin();
            console.log('拼音转换库初始化成功');
        } else {
            console.warn('拼音转换库未加载，使用简化版本');
        }
    } catch (e) {
        console.error('拼音转换库初始化失败:', e);
    }
}

// 获取姓名首字母（使用拼音转换库）
function getInitials(name) {
    if (!name) return '';
    
    // 如果拼音库已加载，使用拼音库获取首字母
    if (pinyin && typeof pinyin.getCamelChars === 'function') {
        try {
            return pinyin.getCamelChars(name);
        } catch (e) {
            console.error('使用拼音库获取首字母失败:', e);
            // 如果失败，回退到简化版本
        }
    }
    
    // 回退方案：简化版本（仅用于兼容性）
    var chars = name.split('');
    var initials = '';
    for (var i = 0; i < chars.length; i++) {
        var char = chars[i];
        var code = char.charCodeAt(0);
        if (code >= 0x4e00 && code <= 0x9fff) {
            // 中文字符，使用简化算法
            initials += String.fromCharCode(65 + (code % 26));
        } else {
            // 非中文字符，直接使用
            initials += char.toUpperCase();
        }
    }
    return initials;
}

// 管理员登录相关函数
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    // 自动聚焦到用户名输入框
    setTimeout(function() {
        document.getElementById('username').focus();
    }, 10);
}

function hideLoginForm() {
    document.getElementById('loginForm').style.display = 'none';
}

function login() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        isAdmin = true;
        document.body.classList.add('admin-mode');
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        hideLoginForm();
        
        // 使用 setTimeout 确保 DOM 更新完成后再切换标签页
        setTimeout(function() {
            switchTab('upload');
        }, 50);
    } else {
        alert('用户名或密码错误！');
    }
}

function logout() {
    isAdmin = false;
    document.body.classList.remove('admin-mode');
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
    switchTab('analysis');
    // 显示退出提示弹窗
    showLogoutMessage();
}

// 键盘事件处理器（用于回车键关闭弹窗）
var logoutMessageHandler = null;

// 显示退出提示弹窗
function showLogoutMessage() {
    document.getElementById('logoutMessage').style.display = 'flex';
    
    // 添加键盘事件监听
    logoutMessageHandler = function(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            closeLogoutMessage();
        }
    };
    document.addEventListener('keydown', logoutMessageHandler);
}

// 关闭退出提示弹窗
function closeLogoutMessage() {
    document.getElementById('logoutMessage').style.display = 'none';
    
    // 移除键盘事件监听
    if (logoutMessageHandler) {
        document.removeEventListener('keydown', logoutMessageHandler);
        logoutMessageHandler = null;
    }
}

// 初始化访客模式
function initVisitorMode() {
    document.body.classList.remove('admin-mode');
    isAdmin = false;
    switchTab('analysis');
    startCountdown();
}

// 启动倒计时功能
function startCountdown() {
    var countdown = 6;
    var countdownText = document.getElementById('countdownText');
    
    function updateCountdown() {
        if (countdownText) {
            countdownText.textContent = countdown + '秒后自动关闭';
        }
        countdown--;
        
        if (countdown < 0) {
            closeVisitorNotice();
        } else {
            setTimeout(updateCountdown, 1000);
        }
    }
    
    updateCountdown();
}

// 关闭访客模式提示框
function closeVisitorNotice() {
    var notice = document.getElementById('visitorNotice');
    if (notice) {
        var countdownText = document.getElementById('countdownText');
        if (countdownText) {
            countdownText.textContent = '已关闭';
        }
        notice.style.transition = 'opacity 0.5s ease-out';
        notice.style.opacity = '0';
        setTimeout(function() {
            notice.style.display = 'none';
        }, 500);
    }
}

// 标签页切换
function switchTab(tabName) {
    if (tabName === 'upload' && !isAdmin) {
        alert('此功能仅限管理员使用，请先登录管理员账户！');
        return;
    }

    if (!isAdmin && !['analysis', 'waiting', 'screening', 'score', 'guidance'].includes(tabName)) {
        return;
    }

    var tabContents = document.querySelectorAll('.tab-content');
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    var targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    var tabButtons = document.querySelectorAll('.tab');
    for (var i = 0; i < tabButtons.length; i++) {
        var button = tabButtons[i];
        var onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && onclickAttr.indexOf('switchTab(\'' + tabName + '\')') !== -1) {
            button.classList.add('active');
        }
    }
}

// 打开刑务工作指引页面
function openGuidancePage(pageName) {
    var pageMap = {
        'meeting-minutes': 'guidance/meeting-minutes.html',
        'important-notes': 'guidance/important-notes.html',
        'sentence-reduction-requirements': 'guidance/sentence-reduction-requirements.html',
        'implementation-rules': 'guidance/implementation-rules.html',
        'sentence-reduction-conditions': 'guidance/sentence-reduction-conditions.html'
    };
    
    var pageUrl = pageMap[pageName];
    if (pageUrl) {
        window.open(pageUrl, '_blank');
    } else {
        alert('页面不存在');
    }
}

// 通用分页更新函数
function updatePagination(dataLength, currentPage, pageSize, paginationId, displayFunction, pageVar) {
    var totalPages = Math.ceil(dataLength / pageSize);
    var pagination = document.getElementById(paginationId);
    
    console.log('更新分页: ' + paginationId + ', 数据长度: ' + dataLength + ', 当前页: ' + currentPage + ', 总页数: ' + totalPages);
    
    pagination.innerHTML = '';
    
    // 上一页按钮
    var prevBtn = document.createElement('button');
    prevBtn.textContent = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = function() {
        console.log('上一页点击: 当前页 ' + currentPage + ', 总页数 ' + totalPages);
        if (currentPage > 1) {
            if (pageVar === 'currentScreeningPage') {
                currentScreeningPage--;
            } else if (pageVar === 'currentScorePage') {
                currentScorePage--;
            } else if (pageVar === 'currentAnalysisPage') {
                currentAnalysisPage--;
            } else if (pageVar === 'currentWaitingPage') {
                currentWaitingPage--;
            }
            console.log('上一页: 新页码 ' + eval(pageVar));
            displayFunction();
        }
    };
    pagination.appendChild(prevBtn);
    
    // 页码按钮
    for (var i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            var pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            (function(pageNum) {
                pageBtn.onclick = function() {
                    console.log('页码点击: ' + pageNum);
                    if (pageVar === 'currentScreeningPage') {
                        currentScreeningPage = pageNum;
                    } else if (pageVar === 'currentScorePage') {
                        currentScorePage = pageNum;
                    } else if (pageVar === 'currentAnalysisPage') {
                        currentAnalysisPage = pageNum;
                    } else if (pageVar === 'currentWaitingPage') {
                        currentWaitingPage = pageNum;
                    }
                    console.log('页码: 新页码 ' + eval(pageVar));
                    displayFunction();
                };
            })(i);
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            var ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }
    
    // 下一页按钮
    var nextBtn = document.createElement('button');
    nextBtn.textContent = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = function() {
        console.log('下一页点击: 当前页 ' + currentPage + ', 总页数 ' + totalPages);
        if (currentPage < totalPages) {
            if (pageVar === 'currentScreeningPage') {
                currentScreeningPage++;
            } else if (pageVar === 'currentScorePage') {
                currentScorePage++;
            } else if (pageVar === 'currentAnalysisPage') {
                currentAnalysisPage++;
            } else if (pageVar === 'currentWaitingPage') {
                currentWaitingPage++;
            }
            console.log('下一页: 新页码 ' + eval(pageVar));
            displayFunction();
        }
    };
    pagination.appendChild(nextBtn);
    
    // 显示页码信息
    var pageInfo = document.createElement('span');
    pageInfo.textContent = '第 ' + currentPage + ' 页，共 ' + totalPages + ' 页';
    pageInfo.id = paginationId.replace('Pagination', 'PageInfo');
    pagination.appendChild(document.createTextNode(' '));
    pagination.appendChild(pageInfo);
}

// 通用权限检查函数
function checkAdminPermission() {
    if (!isAdmin) {
        alert('此功能仅限管理员使用，请先登录管理员账户！');
        return false;
    }
    return true;
}

// 转换为CSV格式
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    var headers = Object.keys(data[0]);
    var csvRows = [headers.join(',')];
    
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var values = [];
        for (var j = 0; j < headers.length; j++) {
            var header = headers[j];
            var value = row[header];
            if (typeof value === 'string' && value.indexOf(',') !== -1) {
                values.push('"' + value + '"');
            } else {
                values.push(value);
            }
        }
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// 下载CSV文件
function downloadCSV(csv, filename) {
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 通用JSON导出函数
function exportDataAsJSON(data, filename) {
    var jsonString = JSON.stringify(data, null, 2);
    downloadJSON(jsonString, filename);
}

// 下载JSON文件
function downloadJSON(jsonString, filename) {
    var blob = new Blob([jsonString], { type: 'application/json' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// 验证时间范围
function validateDateRange(dateFrom, dateTo) {
    if (dateFrom && dateTo && dateFrom > dateTo) {
        alert('开始时间不能晚于结束时间，请重新选择！');
        return false;
    }
    return true;
}

// 获取类别样式
function getCategoryClass(category) {
    if (typeof category !== 'string') return '';
    if (category.includes('劳动分')) return 'category-劳动分';
    if (category.includes('教育分')) return 'category-教育分';
    if (category.includes('监管分')) return 'category-监管分';
    if (category.includes('劳动')) return 'category-劳动分';
    if (category.includes('教育')) return 'category-教育分';
    if (category.includes('监管')) return 'category-监管分';
    return 'category-other';
}

// 切换事实文本显示
function toggleFactText(element) {
    var isTruncated = element.getAttribute('data-truncated') === 'true';
    var fullText = element.getAttribute('data-full-text');
    
    if (isTruncated) {
        element.textContent = fullText;
        element.setAttribute('data-truncated', 'false');
    } else {
        element.textContent = fullText.substring(0, 50) + '...';
        element.setAttribute('data-truncated', 'true');
    }
}

// ========== Excel文件上传处理函数 ==========

// Excel文件上传处理函数
function handleFileUpload(fileType, inputElement) {
    if (!checkAdminPermission()) {
        if (inputElement) {
            inputElement.value = '';
        }
        return;
    }
    
    var file = inputElement.files[0];
    if (!file) {
        return;
    }
    
    // 验证文件类型
    var fileName = file.name.toLowerCase();
    var isXlsx = fileName.length >= 5 && fileName.substring(fileName.length - 5) === '.xlsx';
    var isXls = fileName.length >= 4 && fileName.substring(fileName.length - 4) === '.xls';
    if (!isXlsx && !isXls) {
        alert('请上传Excel文件（.xlsx或.xls格式）！');
        inputElement.value = '';
        return;
    }
    
    // 显示加载提示
    var uploadResults = document.getElementById('uploadResults');
    var convertedFiles = document.getElementById('convertedFiles');
    if (uploadResults) {
        uploadResults.style.display = 'block';
    }
    if (convertedFiles) {
        convertedFiles.innerHTML = '<p style="color: #666;">正在处理文件：' + file.name + '...</p>';
    }
    
    // 读取文件
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            
            // 转换工作簿为JSON
            var convertedData = convertWorkbookToJson(workbook, file.name, fileType);
            
            if (convertedData.length === 0) {
                throw new Error('Excel文件为空或格式不正确！');
            }
            
            // 生成JSON文件名
            var jsonFileName = getJsonFileName(fileType, file.name);
            
            // 自动下载JSON文件
            downloadJSON(JSON.stringify(convertedData, null, 2), jsonFileName);
            
            // 显示转换结果
            showUploadResults(file.name, convertedData, fileType, jsonFileName);
            
        } catch (error) {
            console.error('Excel转换错误：', error);
            alert('文件转换失败：' + (error.message || '未知错误，请检查Excel文件格式！'));
            if (convertedFiles) {
                convertedFiles.innerHTML = '<div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; color: #721c24;">' +
                    '<strong style="color: #721c24;">✗ 转换失败</strong><br>' +
                    '<small>' + (error.message || '未知错误') + '</small>' +
                    '</div>';
            }
        } finally {
            // 重置文件输入
            inputElement.value = '';
        }
    };
    
    reader.onerror = function() {
        alert('文件读取失败，请重试！');
        inputElement.value = '';
        if (convertedFiles) {
            convertedFiles.innerHTML = '<div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; color: #721c24;">' +
                '<strong style="color: #721c24;">✗ 文件读取失败</strong>' +
                '</div>';
        }
    };
    
    // 以ArrayBuffer格式读取文件
    reader.readAsArrayBuffer(file);
}

// 转换工作簿为JSON
function convertWorkbookToJson(workbook, fileName, fileType) {
    var result = [];
    
    // 遍历所有工作表
    for (var i = 0; i < workbook.SheetNames.length; i++) {
        var sheetName = workbook.SheetNames[i];
        var worksheet = workbook.Sheets[sheetName];
        
        // 将工作表转换为JSON（使用第一行作为表头）
        var jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,  // 使用数组格式，第一行是表头
            defval: '',  // 空单元格默认值
            raw: false   // 将值转换为字符串
        });
        
        if (jsonData.length > 0) {
            // 转换表格数据
            var convertedData = convertSheetData(jsonData, fileName, sheetName, fileType);
            result = result.concat(convertedData);
        }
    }
    
    return result;
}

// 转换表格数据
function convertSheetData(jsonData, fileName, sheetName, fileType) {
    if (jsonData.length < 1) {
        return [];
    }
    
    // 根据文件类型确定转换规则
    if (fileType === 'screening' || fileName.indexOf('减刑筛查') !== -1 || fileName.indexOf('减刑资格筛查') !== -1) {
        return convertScreeningData(jsonData, fileName);
    } else if (fileType === 'score' || fileName.indexOf('罪犯加扣分公示表') !== -1 || fileName.indexOf('加扣分') !== -1) {
        return convertScoreData(jsonData);
    } else if (fileType === 'recommendation' || fileName.indexOf('减刑假释推荐榜') !== -1 || fileName.indexOf('推荐榜') !== -1) {
        return convertRecommendationData(jsonData);
    } else if (fileType === 'remaining' || fileName.indexOf('余刑') !== -1) {
        return convertRemainingSentenceData(jsonData);
    } else {
        // 默认转换：使用第一行作为表头
        return convertDefaultData(jsonData);
    }
}

// 减刑筛查数据转换
function convertScreeningData(jsonData, fileName) {
    if (jsonData.length < 2) {
        return [];
    }
    
    // 第一行作为表头，第二行开始是数据（与旧格式保持一致）
    var headers = jsonData[0];
    var data = jsonData.slice(1);
    
    // 辅助函数：将日期字符串转换为ISO格式
    function parseDate(dateStr) {
        if (!dateStr || dateStr === '' || dateStr === null || dateStr === undefined) {
            return null;
        }
        // 尝试多种日期格式
        var dateStrTrimmed = String(dateStr).trim();
        if (!dateStrTrimmed) {
            return null;
        }
        
        // 处理Excel日期格式（如：10/29/20）
        var dateMatch = dateStrTrimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (dateMatch) {
            var month = parseInt(dateMatch[1], 10);
            var day = parseInt(dateMatch[2], 10);
            var year = parseInt(dateMatch[3], 10);
            // 处理两位年份
            if (year < 100) {
                year = year < 50 ? 2000 + year : 1900 + year;
            }
            var date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
        
        // 尝试直接解析为日期
        var date = new Date(dateStrTrimmed);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
        
        // 如果无法解析，返回原字符串
        return dateStrTrimmed;
    }
    
    // 辅助函数：转换为数字或null
    function parseNumber(value) {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        var num = Number(value);
        return isNaN(num) ? null : num;
    }
    
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        // 跳过空行
        var isEmptyRow = true;
        for (var k = 0; k < row.length; k++) {
            var cell = row[k];
            if (cell !== '' && cell !== null && cell !== undefined) {
                isEmptyRow = false;
                break;
            }
        }
        if (isEmptyRow) {
            continue;
        }
        
        var rowObj = {};
        for (var j = 0; j < headers.length; j++) {
            var header = String(headers[j] || '').trim();
            if (!header) {
                continue;
            }
            
            var cellValue = row[j];
            
            // 根据字段名进行类型转换，保持与旧格式一致
            if (header === '序号') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '囚号') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '减刑次数') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '间隔期') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '需要表扬数') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '表扬数') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '考核月数') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '表扬系数') {
                rowObj[header] = parseNumber(cellValue);
            } else if (header === '起日' || header === '止日' || header === '考核期起日' || header === '间隔期起日') {
                rowObj[header] = parseDate(cellValue);
            } else {
                // 其他字段保持字符串格式，空值转为null
                if (cellValue === '' || cellValue === null || cellValue === undefined) {
                    rowObj[header] = null;
                } else {
                    rowObj[header] = String(cellValue);
                }
            }
        }
        result.push(rowObj);
    }
    
    return result;
}

// 加扣分数据转换
function convertScoreData(jsonData) {
    if (jsonData.length < 3) {
        return [];
    }
    
    // 第三行作为表头，第四行开始是数据
    var headers = jsonData[2];
    var data = jsonData.slice(3);
    
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        // 跳过空行
        var isEmptyRow = true;
        for (var k = 0; k < row.length; k++) {
            var cell = row[k];
            if (cell !== '' && cell !== null && cell !== undefined) {
                isEmptyRow = false;
                break;
            }
        }
        if (isEmptyRow) {
            continue;
        }
        
        var rowObj = {};
        for (var j = 0; j < headers.length; j++) {
            var header = String(headers[j] || '').trim();
            if (header) {
                rowObj[header] = row[j] !== undefined && row[j] !== null ? String(row[j]) : '';
            }
        }
        result.push(rowObj);
    }
    
    return result;
}

// 推荐榜数据转换
function convertRecommendationData(jsonData) {
    if (jsonData.length < 2) {
        return [];
    }
    
    // 从第三行开始是数据（B列、C列、D列、R列）
    var data = jsonData.slice(2);
    
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var rowObj = {};
        
        // B列（索引1）作为囚号
        if (row[1] !== undefined && row[1] !== null && row[1] !== '') {
            rowObj['囚号'] = String(row[1]);
        }
        
        // C列（索引2）作为姓名
        if (row[2] !== undefined && row[2] !== null && row[2] !== '') {
            rowObj['姓名'] = String(row[2]);
        }
        
        // D列（索引3）作为分监区
        if (row[3] !== undefined && row[3] !== null && row[3] !== '') {
            rowObj['分监区'] = String(row[3]);
        }
        
        // R列（索引17）作为提请幅度
        if (row[17] !== undefined && row[17] !== null && row[17] !== '') {
            rowObj['提请幅度'] = String(row[17]);
        }
        
        // 只保留有数据的记录
        if (rowObj['姓名'] || rowObj['囚号'] || rowObj['分监区'] || rowObj['提请幅度']) {
            result.push(rowObj);
        }
    }
    
    return result;
}

// 余刑数据转换
function convertRemainingSentenceData(jsonData) {
    if (jsonData.length < 2) {
        return [];
    }
    
    // 从第三行开始是数据（B列、C列、D列）
    var data = jsonData.slice(2);
    
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var rowObj = {};
        
        // B列（索引1）作为囚号
        if (row[1] !== undefined && row[1] !== null && row[1] !== '') {
            rowObj['囚号'] = String(row[1]);
        }
        
        // C列（索引2）作为姓名
        if (row[2] !== undefined && row[2] !== null && row[2] !== '') {
            rowObj['姓名'] = String(row[2]);
        }
        
        // D列（索引3）作为余刑
        if (row[3] !== undefined && row[3] !== null && row[3] !== '') {
            rowObj['余刑'] = String(row[3]);
        }
        
        // 只保留有数据的记录
        if (rowObj['姓名'] || rowObj['囚号'] || rowObj['余刑']) {
            result.push(rowObj);
        }
    }
    
    return result;
}

// 默认数据转换（使用第一行作为表头）
function convertDefaultData(jsonData) {
    if (jsonData.length < 1) {
        return [];
    }
    
    var headers = jsonData[0];
    var data = jsonData.slice(1);
    
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        // 跳过空行
        var isEmptyRow = true;
        for (var k = 0; k < row.length; k++) {
            var cell = row[k];
            if (cell !== '' && cell !== null && cell !== undefined) {
                isEmptyRow = false;
                break;
            }
        }
        if (isEmptyRow) {
            continue;
        }
        
        var rowObj = {};
        for (var j = 0; j < headers.length; j++) {
            var header = String(headers[j] || '').trim();
            if (header) {
                rowObj[header] = row[j] !== undefined && row[j] !== null ? String(row[j]) : '';
            }
        }
        result.push(rowObj);
    }
    
    return result;
}

// 从文件名中提取月份信息
function extractMonthFromFileName(fileName) {
    if (!fileName) {
        return '';
    }
    
    // 匹配各种可能的月份格式
    var monthPatterns = [
        /(\d{4})[年\-](\d{1,2})[月\-]/i,        // 2024年1月, 2024-01
        /(\d{4})\.(\d{1,2})/i,                   // 2024.01
        /(\d{4})(\d{2})/i,                       // 202401
        /(\d{1,2})月/i,                          // 1月
        /(\d{1,2})月份/i,                        // 1月份
        /(\d{1,2})期/i,                          // 1期
        /第(\d{1,2})期/i,                        // 第1期
        /(\d{1,2})批次/i,                        // 1批次
        /第(\d{1,2})批次/i                       // 第1批次
    ];
    
    for (var i = 0; i < monthPatterns.length; i++) {
        var match = fileName.match(monthPatterns[i]);
        if (match) {
            if (match.length === 3) {
                // 包含年份的格式
                var year = match[1];
                var month = match[2];
                if (month.length === 1) {
                    month = '0' + month;
                }
                return year + '年' + month + '月';
            } else if (match.length === 2) {
                // 只有月份的格式
                var month = match[1];
                if (month.length === 1) {
                    month = '0' + month;
                }
                var currentYear = new Date().getFullYear();
                return currentYear + '年' + month + '月';
            }
        }
    }
    
    // 如果没有找到月份信息，返回当前月份
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString();
    if (month.length === 1) {
        month = '0' + month;
    }
    return year + '年' + month + '月';
}

// 获取JSON文件名
function getJsonFileName(fileType, originalFileName) {
    var fileTypeMap = {
        'screening': '减刑筛查',
        'score': '罪犯加扣分公示表',
        'recommendation': '减刑假释推荐榜',
        'remaining': '余刑数据'
    };
    
    var typeName = fileTypeMap[fileType] || '数据';
    
    // 如果是推荐榜文件，尝试从文件名提取月份信息
    if (fileType === 'recommendation') {
        var monthInfo = extractMonthFromFileName(originalFileName);
        if (monthInfo) {
            return typeName + '_' + monthInfo + '.json';
        }
    }
    
    // 尝试从原文件名提取日期
    var baseName = originalFileName.replace(/\.(xlsx|xls)$/i, '');
    var monthInfo = extractMonthFromFileName(baseName);
    if (monthInfo) {
        return typeName + '_' + monthInfo + '.json';
    }
    
    // 如果没有找到月份信息，只使用类型名称
    return typeName + '.json';
}

// 获取文件类型名称
function getFileTypeName(fileType) {
    var fileTypeMap = {
        'screening': '减刑筛查文件',
        'score': '加扣分文件',
        'recommendation': '推荐榜文件',
        'remaining': '余刑文件'
    };
    return fileTypeMap[fileType] || fileType;
}

// 显示上传结果
function showUploadResults(fileName, data, fileType, jsonFileName) {
    var convertedFiles = document.getElementById('convertedFiles');
    if (!convertedFiles) {
        return;
    }
    
    var fileTypeName = getFileTypeName(fileType);
    
    convertedFiles.innerHTML = '<div style="padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; color: #155724;">' +
        '<strong style="color: #155724;">✓ 转换成功！</strong><br>' +
        '<small>文件类型：' + fileTypeName + '</small><br>' +
        '<small>原文件：' + fileName + '</small><br>' +
        '<small>JSON文件：' + jsonFileName + '</small><br>' +
        '<small>记录数：' + data.length + ' 条</small>' +
        '</div>';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化拼音转换库
    initPinyin();
    // 初始化访客模式
    initVisitorMode();
});

