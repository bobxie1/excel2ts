@echo off

REM 启用延迟变量扩展
setlocal enabledelayedexpansion

chcp 65001

set /p fileName=请输入要导出的文件名（不区分大小写，可不带扩展名，支持*匹配，如exa*）：

REM 初始化文件列表变量
set fileNames=

REM 查找当前目录下所有匹配的文件，并检查扩展名是否为 .xlsx
for %%i in (%fileName%) do (
    if /i "%%~xi"==".xlsx" (
        REM 拼接文件名
        set fileNames=!fileNames! %%i
    )
)

REM 去掉第一个空格
if defined fileNames set fileNames=%fileNames:~1%

REM 检查是否找到文件
if defined fileNames (
    echo 找到文件: %fileNames%
    REM 调用 export.exe 并传递文件列表作为参数
    export.exe . %fileNames%
) else (
    echo 没有找到匹配的.xlsx文件。
)

REM 结束延迟变量扩展
endlocal

pause