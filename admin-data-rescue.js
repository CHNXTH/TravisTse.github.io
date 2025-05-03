/**
 * 数据修复与恢复工具
 * 用于修复localStorage损坏或丢失的数据
 */

// 从备份恢复数据
function restoreFromBackups() {
    console.group('数据恢复工具');
    console.log('开始寻找可用的备份...');
    
    const backups = [];
    
    // 收集所有备份
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('websiteData_backup_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const timestamp = key.split('_backup_')[1];
                    
                    backups.push({
                        key: key,
                        timestamp: timestamp,
                        data: data,
                        size: new Blob([JSON.stringify(data)]).size
                    });
                } catch (e) {
                    console.warn(`备份 ${key} 已损坏:`, e);
                }
            }
        }
    } catch (e) {
        console.error('读取备份失败:', e);
    }
    
    // 如果没有找到备份
    if (backups.length === 0) {
        console.log('没有找到可用的备份');
        console.groupEnd();
        return {
            success: false,
            message: '没有找到可用的备份'
        };
    }
    
    // 按照时间排序（最新的在前）
    backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    console.log(`找到 ${backups.length} 个备份:`);
    backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.key} (${formatSize(backup.size)})`);
    });
    
    // 使用最新的备份
    const latestBackup = backups[0];
    console.log(`选择最新的备份: ${latestBackup.key}`);
    
    try {
        // 保存当前数据（如果有）
        try {
            const currentData = localStorage.getItem('websiteData');
            if (currentData) {
                localStorage.setItem('websiteData_before_restore', currentData);
                console.log('已保存当前数据为 websiteData_before_restore');
            }
        } catch (e) {
            console.warn('保存当前数据失败:', e);
        }
        
        // 恢复备份
        localStorage.setItem('websiteData', JSON.stringify(latestBackup.data));
        console.log('已恢复数据');
        
        console.groupEnd();
        return {
            success: true,
            message: `已从 ${latestBackup.key} 恢复数据`,
            data: latestBackup.data
        };
    } catch (e) {
        console.error('恢复数据失败:', e);
        console.groupEnd();
        return {
            success: false,
            message: '恢复数据失败: ' + e.message
        };
    }
}

// 数据紧急修复
function emergencyDataRepair() {
    console.group('数据紧急修复');
    console.log('开始执行紧急数据修复...');
    
    try {
        // 获取当前数据
        let currentData = null;
        try {
            const dataStr = localStorage.getItem('websiteData');
            if (dataStr) {
                currentData = JSON.parse(dataStr);
            }
        } catch (e) {
            console.error('解析当前数据失败:', e);
            // 尝试使用备份
            const restore = restoreFromBackups();
            if (restore.success) {
                console.log('已从备份中恢复数据');
                console.groupEnd();
                return restore;
            }
        }
        
        // 如果没有数据或数据已损坏，创建一个最小的有效数据结构
        if (!currentData) {
            console.log('创建基本数据结构...');
            currentData = {
                profile: {},
                education: [],
                experience: [],
                projects: [],
                papers: [],
                awards: [],
                social: [],
                footprints: [],
                settings: { password: '725500@20020303' },
                meta: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    isEmergencyRepair: true
                }
            };
        } else {
            // 确保所有必要的字段都存在
            currentData.profile = currentData.profile || {};
            currentData.education = Array.isArray(currentData.education) ? currentData.education : [];
            currentData.experience = Array.isArray(currentData.experience) ? currentData.experience : [];
            currentData.projects = Array.isArray(currentData.projects) ? currentData.projects : [];
            currentData.papers = Array.isArray(currentData.papers) ? currentData.papers : [];
            currentData.awards = Array.isArray(currentData.awards) ? currentData.awards : [];
            currentData.social = Array.isArray(currentData.social) ? currentData.social : [];
            currentData.footprints = Array.isArray(currentData.footprints) ? currentData.footprints : [];
            currentData.settings = currentData.settings || { password: '725500@20020303' };
            
            // 添加或更新元数据
            if (!currentData.meta) {
                currentData.meta = {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    repaired: true
                };
            } else {
                currentData.meta.lastModified = new Date().toISOString();
                currentData.meta.repaired = true;
            }
        }
        
        // 保存修复后的数据
        localStorage.setItem('websiteData', JSON.stringify(currentData));
        console.log('数据修复完成并已保存');
        
        // 立即创建一个备份
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const backupKey = `websiteData_backup_repaired_${timestamp}`;
        localStorage.setItem(backupKey, JSON.stringify(currentData));
        console.log(`已创建修复后的备份: ${backupKey}`);
        
        console.groupEnd();
        return {
            success: true,
            message: '数据修复完成',
            data: currentData
        };
    } catch (e) {
        console.error('紧急数据修复失败:', e);
        console.groupEnd();
        return {
            success: false,
            message: '紧急数据修复失败: ' + e.message
        };
    }
}

// 自动检测并修复数据
function autoDetectAndRepair() {
    console.log('开始自动检测和修复数据...');
    
    try {
        // 首先检查是否存在websiteData
        const dataStr = localStorage.getItem('websiteData');
        if (!dataStr) {
            console.warn('未找到websiteData，尝试从备份恢复...');
            return restoreFromBackups();
        }
        
        // 尝试解析
        try {
            const data = JSON.parse(dataStr);
            
            // 检查数据结构完整性
            const requiredKeys = ['profile', 'education', 'experience', 'projects'];
            const missingKeys = requiredKeys.filter(key => !(key in data));
            
            if (missingKeys.length > 0) {
                console.warn(`数据缺少关键字段: ${missingKeys.join(', ')}，执行修复...`);
                return emergencyDataRepair();
            }
            
            // 检查数组字段是否为数组
            const arrayFields = ['education', 'experience', 'projects', 'papers', 'awards', 'social', 'footprints'];
            const invalidArrays = arrayFields.filter(field => field in data && !Array.isArray(data[field]));
            
            if (invalidArrays.length > 0) {
                console.warn(`字段类型错误: ${invalidArrays.join(', ')} 不是数组，执行修复...`);
                return emergencyDataRepair();
            }
            
            console.log('数据检查通过，无需修复');
            return {
                success: true,
                message: '数据检查通过，无需修复',
                data: data
            };
        } catch (e) {
            console.error('数据格式错误，尝试修复:', e);
            return emergencyDataRepair();
        }
    } catch (e) {
        console.error('数据检测失败:', e);
        return {
            success: false,
            message: '数据检测失败: ' + e.message
        };
    }
}

// 格式化文件大小
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
}

// 导出到全局
window.dataRescue = {
    restoreFromBackups: restoreFromBackups,
    emergencyDataRepair: emergencyDataRepair,
    autoDetectAndRepair: autoDetectAndRepair
}; 