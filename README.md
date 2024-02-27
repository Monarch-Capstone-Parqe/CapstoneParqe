# CapstoneParqe


# Table of Contents
1. [Introduction](#intro)
   1. [Project Description](#projectDesc)
   2. [Project Details](#projectDetails)
   3. [Capstone Team](#capstoneTeam)
2. [How to Set Up Development Environment ](#Set)
   1. [Set Up with Windows](#setupWindow)
   2. [Set Up with Linux](#setupLinux)
3. Conclusion





# Introduction <a name="intro"></a>
PSU capstone project from team Monarch
Link to more detailed Documentaion [Pareq Document]().

## Project Description <a name="projectDesc"></a>
This capstone project is to develop the PrusaSlicer Automated Routing and Quoting Engine (PARQE). Which aims to modernize and automate the 3D printing submission workflow in the Electronics Prototyping Lab. 

## Project Details <a name="projectDetails"></a>
There are 5 main componets to this project

1. [User Interface](#UserApi)
2. [Staff Interface](#StaffApi)
3. [Backend](#Backend)
4. [Octoprint](#Octo)
5. [Database](#Database)

---
### *User API* <a name="UserApi"></a>
#### Purpose:
The User webpage/API is the first step for PARQE which allows users to submit 3d models in .stl, .3mf, .stp, or .step format and allow users to alter printing configuration. 

#### Functionality:


---
### 2) Staff API <a name="StaffApi"></a>
#### Purpose:
The Staff webpage/API is a manageral webpage which allows staff to view, approve, and deny incomming print jobs. 

#### Functionality:
There are 3 pages 
1. Pending page
2. Approved page
3. Denied page

The pending will be the first page the EPL staff will view. This page list jobs that have been submitted by users through the User API. 

Apporve page will list all proved print jobs

Denied page will list all denied print jobs 

---
### 3) Backend <a name="Backend"></a>
Related Files
1. file 1
2. file 2
3. file 3
   
#### Purpose:
Acts as the glue which allow differnt compenets of the PARQE project to communicate with each other 
#### Functionality:

---
### 4) Octoprint <a name="Octo"></a>

#### Purpose:

#### Functionality:

---
### 5) Database <a name="Database"></a>

#### Purpose:

#### Functionality:

## Capstone Team <a name="capstoneTeam"></a>
List of capstone teams and members who participated in the development of PARQE
1. Team Monarch (Fall-Winter 2023-24)
   - Team Lead: Michael Do
   - Team Memebers: 
2. TBA
   - Team Lead: N/A
   - Team Memebers: N/A



# How to Set Up Development Environment <a name="Set"></a>
> [!NOTE]
> It is recommended for developers to develop on Windows and Linux (Mac is not recommended due to nuances)



### Required 
1. Version 3.12.2 Python
   - Go to https://www.python.org/downloads/ and download Python
   - During installation process ensure that "Add python.exe to PATH" is checked.
3. Latest Version of Git
   - Go to https://git-scm.com/book/en/v2/Getting-Started-Installing-Git and follow instructions to install Git
4. IDE
   - Microsoft Visual Studios
   - Visual Studios code
   - JetBrains
## Window <a name="setupWindow"></a>
> [!NOTE]
> Developers can setup local branch however they see fit. This is a barebones basic branch creation.
### Setting Up Local Branch
1. Create local folder
2. Open Git Bash and navivagte to previoursly created folder
3. Once in desided direcoty, clone repo
```
git clone https://github.com/Monarch-Capstone-Parqe/CapstoneParqe.git
```
![image](https://github.com/Monarch-Capstone-Parqe/CapstoneParqe/assets/92550433/4d358630-2db6-4cf4-9e4b-740cb7ad757c)

4. Create development branch
```
git checkout (master branch)
git pull
git checkout -b <branch-name>
git push --set-upstream origin <branch name>
```
![image](https://github.com/Monarch-Capstone-Parqe/CapstoneParqe/assets/92550433/086854e3-aa84-44b4-9523-ec4c322462ef)

5. 

## Linux <a name="setupLinux"></a>
```
git checkout (master branch)
git pull
git checkout -b <branch-name>
git push --set-upstream origin <branch name>
```
