## Page 1

# Product Information

**Product name:** NORTEXT Editor for Workstation  
**Product number:** NEWS N  

## Description of product

| Product number | Name                  |
|----------------|-----------------------|
| 230051N        | NORTEXT NEWS          |
| 230114N        | NORTEXT NEWS Jr.      |
| 211910N        | NORTEXT NEWS Dial     |
| 211911N        | NORTEXT NEWS Jr. Dial |

The NORTEXT Editor for Workstation (NEWS) is a family of products that provides an editing environment on the PC that is closely integrated with a NORTEXT text system running on a remote server.

The products allow editing of an existing article or creation of a new one. The article may be stored either locally on the PC or on the remote NORTEXT system. It is also possible to operate on the queues and lines of the remote system.

In the full versions of NEWS, it is possible to hyphenate and justify (H&J) an article and to obtain a typographic preview.

In NEWS Jr., the H&J routines are replaced by a character-, word-, and line-counting routine which places the result in the article record. Consequently, it is not possible to justify or obtain a typographic preview of an article with this version.

The Dial-Up function allows an article to be prepared off-line before connecting to a remote NORTEXT system using an autodial modem controlled by script files.

## Reasons for new version

- Support for the use of UE profiles
- Important error corrections

PI Rev. 901002

NEWS-N02

---

## Page 2

# Product Information

| Product name              | Product number |
|---------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

## Table of Contents

| Topic                          | Page |
|--------------------------------|------|
| Requirements                   | 3    |
| Product contents               | 5    |
| Installation procedure         | 8    |
| Customisation                  | 10   |
| Operation                      | 15   |
| Product history                | 18   |
| Additional programs delivered. | 22   |
| Other information              | 28   |
| Questionnaire                  | 38   |

## Copyright notice

The software described in this document is furnished under licence and may be used or copied only in accordance with the terms of such licence.

This document contains proprietary information of ND Comtec AS.

Copyright (C) 1990 by ND Comtec AS. All rights reserved.

---

## Page 3

# Product Information

**Product name**: NORTEXT Editor for Workstation  
**Product number**: NEWS N

## Requirements

The following products must be installed and the specified conditions satisfied in order to use this product. Requirements specified for Ethernet communications also apply to Cheapernet communication.

**NOTE**: It is also possible for NEWS to communicate over a serial line with hosts running the A release of the Terminal Line Server (named OWS-SERVER-A at runtime). With the last official release, A03, from ND, NEWS can be used as it is set up. However, by using the unofficial version, A90 obtainable from ND Comtec (Trondheim!), you can get some increase in speed by setting NEWS to use large textblocks (with Y and /big). It is necessary to use CONNECT version A07 on the PC to use the A version of the Terminal Line Server.

The following ND host requirements assume that the B version of the Terminal Line Server (named OWS-LINE-B at runtime) is being used. The B version is more reliable than the A version, but a bit slower. It is possible for an ND host to simultaneously run both versions of the Terminal Line Server as they are named differently at runtime.

### PC

Any IBM-compatible PC-AT in the following configuration:

- DOS 3.30 or better

  - at least 424Kb free DOS memory for NEWS  
  or - at least 431Kb free DOS memory for NEWS + Dial-up  
  or - at least 334Kb free DOS memory for NEWS Jr  
  or - at least 341Kb free DOS memory for NEWS Jr + Dial-up

  - at least 64Kb free extended memory (or HIMEM.SYS installed)  
  - at least 4Mb free disk space  
  - the CONNECT.EXE driver loaded  
    - with ver. A33 or better for Ethernet communication  
    - or ver. B00 or better for serial communication.
  - the NDSCREEN.EXE driver loaded using interrupt 66hex  
  - the DOSVMXxx.COM keyboard driver loaded via VMKLOAD.EXE

- the NTX Enhanced Keyboard (ND 110896 xx) is the preferred keyboard to use with NEWS (NDKEYB.COM from ND PC Starter kit is then replaced with NTXKEYB.COM delivered with this product)

either  

- OWS OpenLAN Adaptor / Ethernet (ND 110386)  
or  
- OWS OpenLAN Adaptor / Cheapernet (ND 110394)  
or  
- Serial communications port (COM1 or COM2)

---

PI Rev. 901002  
NEWS-N02

---

## Page 4

# Product Information

**Product name:**  
NORTEXT Editor for Workstation

**Product number:**  
NEWS N

---

## Requirements

either
- Desk Top Manager (DTM) for OWS (ND 230025C)
- PC-ET Communications SW (ND 230033A) for Ethernet

or
- ND PC Starter Kit (ND 230123A)
- ND Connect Module (ND 230125A) for Ethernet

- A terminal emulator program suitable for transferring files from the host is required when using serial communications. DTM includes such a facility but S-LINK or WinLink may be required when using the PC Starter Kit. The Ethernet software listed above includes FTP which may be used when this communications medium is used.

## ND Host

Any ND 500(0) computer with the following software installed:
- SINTRAN III VSX K workmode 500 patchfile 13000, or later
- NORTEXT Basic RT (ND 211485) version M04

either
- NORTEXT Access Server (ND 211486) version B04  
  for operation via Ethernet
- PCFT for PDWS for ND500(0) (ND 211191) version C01  
  to access images using MGR code

or
- OWS Terminal Line Server (ND 211259) version B  
  for operation via serial connections

- NORTEXT Editor for ND 500(0) (ND 211030) version M04  
  for LOAD-LAMU-LA:DOM
- NORTEXT Typo. Tables Maintenance (ND 210804) version M04  
  for TABFIL-WS:DOM
- NORTEXT Screen Font Set (ND 211193) version D02  
  for typographic preview (NOT required with NEWS Jr.)

- Focus version H *and* version G (to upgrade forms from F)

## XENIX Host

To be announced

## UNIX Host

To be announced

---

PI Rev. 901002

NEWS-N02

---

## Page 5

# Product Information

| Product name                         | Product number |
|--------------------------------------|----------------|
| NORTEXT Editor for Workstation       | NEWS N         |

## Product Contents

The following components are included in this product:

### Hardware

None

### Software

#### Disk number 1

The following files are all located in the root directory of the distribution floppy diskette and with the exception of the first two files are copied to the `%ND-OWS%\NTX-WP` directory during the installation procedure.

| Name            | Contents                                                      |
|-----------------|---------------------------------------------------------------|
| INSTALL.EXE     | Installation program                                         |
| INST`xx`.TXT    | Text file used by INSTALL.EXE                                 |
| NTXMENU.EXE     | NORTEXT Menu Program                                          |
| NTXMENU.MSG     | Messages used by NTXMENU.EXE                                  |
| NTXMENU.DEF     | Parameter file for NTXMENU.EXE                                |
| MENUEDIT.EXE    | Editor for NTXMENU.DEF and NTXMENU.MSG                        |
| NHC.EXE         | NORTEXT Host Check Program.                                   |
| NHC.TXT         | Description of NHC                                            |
| NORSEM`xx`.DAT  | NEWS standard text strings                                    |
| DATSEM`xx`.DAT  | NEWS error messages                                           |
| NTX`xx`.HLP     | NEWS help message file                                        |
| WPNTX.INI       | NEWS initialisation file                                      |
| NTX`xx`.TAB     | Supershift conversion tables                                  |
| HIMEM.SYS       | Driver for accessing extended memory                          |
| CLOSELIB.EXE    | For use by WinStart/WinSMX                                    |
| STR-NTX.EXE     | For use by WinStart/WinSMX                                    |
| NTX.PIF         | For use by WinStart/WinSMX                                    |
| NTX.COM         | For use by WinStart/WinSMX                                    |

PI Rev. 901002

NEWS-N02

---

## Page 6

# Product Information

**Product Name:** NORTEXT Editor for Workstation  
**Product Number:** NEWS N  

## Disk Number 2

This disk contains one file whose name is product dependent. During installation the file is copied to the `&ND-OWS&\NTX-WP` directory, expanded and renamed `NTX.EXE`.

| Name       | Contents                                                |
|------------|---------------------------------------------------------|
| NEWS.EXE   | NEWS with H&J, but no Dial-Up. (ND 230051)              |
| NEWS-D.EXE | NEWS with both H&J and Dial-Up. (ND 211910)             |
| NEWS-J.EXE | NEWS with neither H&J nor Dial-Up. (ND 230114)          |
| NEWS-JD.EXE| NEWS without H&J, but with Dial-Up. (ND 211911)         |

## Disk Number 3

The following files are all located in the root directory of the distribution floppy diskette and are copied to the `&ND-OWS&\NTX-WP` directory during the installation procedure.

| Name           | Contents                                                                                   |
|----------------|--------------------------------------------------------------------------------------------|
| COMMANDS.FRM   | Focus forms for the Y-commands.                                                            |
| ARTICLES.FRM   | Focus forms for article record presentation.                                               |
| TABFILE.DAT    | Conversion tables for conversion between the WP (16 bit) and NTX (8 bits) character sets.  |
| NTXWPARA.NTX   | Parameter file defining the file names and user parameters used by NEWS during H&J.        |
| NTXWFORM.NTX   | Parameter file defining the FOCUS form files and the user defined elements of the status line.|
| POSCR100.DAT   | Example tabfile for Postscript printers.                                                   |
| FORM100.DAT    | Example format file                                                                        |
| LAMUSNTX.DAT   | Example hyphenation tables and global format name directory.                               |
| DIALUP.CMD     | Example dial-up script file to connect to a NORTEXT text system on a host running User Environment using a telephone line. |
| S3UP.CMD       | Example dial-up script file to connect to a NORTEXT text system on a host NOT running User Environment using a telephone line. |
| DIALDOWN.CMD   | Example dial-up script file to close down a connection to a NORTEXT text system accessed using a telephone line. |

---

PI Rev. 901002

NEWS-N02

---

## Page 7

# Comtec - Product Information

| Page        | 7 of 38      |
|-------------|--------------|

## Product Information

| Product name                          | Product number |
|---------------------------------------|----------------|
| NORTEXT Editor for Workstation        | NEWS N         |

## Documentation

The following documentation is included with the product.

- **NORTEXT Editor Reference Manual** (ND 861035)
- **NORTEXT Editor for Work Station** (ND 861071)

The following documentation is also relevant to this product.

- **NORTEXT Typographic Function Codes** (ND 861029)
- **NORTEXT Typographic Maint. Ref. Manual** (ND 861030)
- **NORTEXT Editorial and Production System**  
  Release Information M04 Version (ND 861058)

```
+----+            +-------------------------------+
| ND |            | Product Information           |
|    +------------| Product name                  |
| Com|            | NORTEXT Editor for Workstation|
| tec|            |-------------------------------|
+----+            | Product number                |
                  | NEWS N                        |
                  +-------------------------------+
```

```
PI Rev. 901002                     NEWS-N02
```

---

## Page 8

# Product Information

| Product name | Product number |
|--------------|----------------|
| NORTEXT Editor for Workstation | NEWS/N |

## Installation Procedure

Check that the following items are satisfied before starting this installation.

- The PC Starter Kit (ND 230123A) or DTM version C has been installed.
- The environment variable ND-OWS must be defined. This is normally done by including the following command in the AUTOEXEC.BAT file.

```
SET ND-OWS=C:\ND-OWS
```

### Automatic Installation

- Insert the distribution floppy disk number 1 in drive A: and type

```
A:\INSTALL
```

  The language being installed must match that of the PC Starter Kit or DTM version installed already.

- Insert the other two disks when prompted.
- Perform the customisation procedure.
- Reboot the PC.

### Manual Installation

There is no manual installation procedure for this product.

### Upgrading an Existing Installation

- Change to the directory containing the NTX.EXE program by typing the following command

```
CD C:\ND-OWS\NTX-WP
```

- Insert the distribution floppy disk number 2 in drive A: and type

```
A:\<filename>
```

  where `<filename>` is the name of the file on disk two as given in

**PI Rev. 901002**  
**NEWS-N02**

---

## Page 9

# Product Information

| Product name                      | Product number |
|----------------------------------|-----------------|
| NORTEXT Editor for Workstation   | NEWS N          |

---

the Product Contents section. Overwrite the existing file when prompted.

- Delete the BMS scratch file by typing the following command

```
DEL C:\ND-OWS\SCRATCH\BMS.SWP
```

---

PI Rev. 901002

NEWS-N02

---

## Page 10

# Product Information

| Product name                          | Product number |
| ------------------------------------- | -------------- |
| NORTEXT Editor for Workstation | NEWS N          |

## Customisation

The references to converting and copying files from the host in the following discussion only apply to the use of NEWS with a SINTRAN based NORTEXT text system.

To complete the installation of NEWS it is necessary to copy some files from the host. In the case of the tabfiles (both for NORTEXT and the typesetters) it is also necessary to convert these files before copying them to the PC. It is also necessary to produce a modified LAMU file for use with NEWS. These procedures are discussed in the following sections.

## Outline

The following table shows the relationship between NEWS files on the PC and the corresponding host files.

| PC             | ND host                  | Contents                             |
| -------------- | ------------------------ | ------------------------------------ |
| NTXWFORM.NTX   | NTXWP-FORM-NAMES:SYMB    | Parameter file                       |
| NTXWPARA.NTX   | NTXWP-PARAM-:NTXP        | Parameter file                       |
| TABFILE.DAT    | TABFIL-EDITOR:DATA       | Editor conversion tables             |
| LAMUSNTX.DAT   | LAMU-PC-FILE-NTX:DATA    | Hyph. tables & format directory      |
| POSCR100.DAT   | POSCR-100:DATA           | Tabfile for PostScript               |
| COMMANDS.FRM   | COMMANDS-NTX:FORM        | Focus forms                          |
| ARTICLES.FRM   | ARTICLES-NTX:FORM        | Focus forms                          |
| NTX(xx).HLP    | NTX-<xx>-:HELP           | NEWS help messages                   |
| NTX(xx).TAB    | NTX-2200-<xx>:TAB        | Input conversion tables              |

## Parameter files

The editor parameter files NTXWP-FORM-NAMES:SYMB and NTXWP-PARAM-:NTXP may be copied from a NORTEXT system on a host to the PC for use with NEWS. However, it is necessary to change the file definitions contained in these files to the name and path corresponding to the files on the PC.

**Example:**

```
(USERFILES-NTX)POSCR-100:DATA => C:\ND-OS\NTX-WP\POSCR100.DAT
```

It should be noted that not all the entries in these parameter files are relevant to operation on the PC. The parameters are discussed further later in this chapter.

---

PI Rev. 901002               NEWS-N02

---

## Page 11

# Product Information

| Product name              | Product number |
|---------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

## Table Files

The `TABFIL-WS::DOM` program must be used to convert the `TABFIL-EDITOR` file and the typesetter tabfiles from the format used by NORTEXT systems running on a SINTRAN host to the format required on the PC. The converted file produced by this program has the same name as the original file, but with the extension `.WS`. The program is started by typing:

```
@ND (MAINTENANCE-NTX)TABFIL-WS TABFIL-EDITOR ⏎
```

The typesetter tabfiles must also be similarly converted. After conversion the files may be copied to the PC. Note that version A04 or later of `TABFIL-WS::DOM` is required.

## Format Files

Format files may be copied from a NORTEXT system on a host to the PC for use with NEWS without modification. It is important to ensure that the format files are defined in the `NTXWPARA.NTX` parameter file in exactly the same sequence as in the corresponding file on host. If format files are defined out of sequence the use of global formats will fail.

## LAMU File

The LAMU file on the PC contains only the hyphenation tables and (global) format name directory. This reduced file may be created by typing:

```
@ND (MAINTENANCE-NTX)LOAD-LAMU /PC ⏎ (Note the /PC modifier)
```

The resulting `LAMU-PC-FILE-NTX::DATA` file may be copied to the PC. Note that version N04 or later of `LOAD-LAMU::DOM` is required.

## Form Files

The NORTEXT Editor on a SINTRAN host uses Focus Version F whilst NEWS uses version H. It is therefore necessary to convert the form files before they may be used with NEWS. This conversion must be performed in two stages. First, use `FOCUS-DEF-G` to convert to G format, and then use `FOCUS-DEF-H` to convert to H format. Relevant commands are:

- `MAKE-UPTODATE` to convert forms, and
- `ENLARGE-FILE` to expand the form file if necessary.

Once the form files have been converted they may be copied to the PC and used by NEWS without further modification. It is important.

---

PI Rev. 901002 | NEWS-N02

[Scanned by Jonny Oddene for Sintran Data © 2021]

---

## Page 12

# Product Information

## Product Name
NORTEXT Editor for Workstation

## Product Number
NEWS N

---

that the correct path is specified in NTXWFORM.NTX.

### Example:

```
L1 = \ND-OWS\NTX-WP\ARTICLES.FRM
L2 = \ND-OWS\NTX-WP\COMMANDS.FRM
```

## Other Files

The NTX-:HELP file may be copied directly from a SINTRAN host to the PC and will function correctly. However, the information presented will refer to the equivalent operation of the host editor and will not always be relevant to NEWS. A help file appropriate to NEWS is supplied on disk 3 if it exists for the particular language.

The NTX-2200:TAB file may be copied directly from a SINTRAN host to the PC and will function correctly. However, the additional keys available on a PC keyboard will not be mapped in the input conversion table in this file. Consequently some modification may be required to obtain maximum functionality.

## Parameter File NTXWPARA.NTX

This text file contains the parameters which are used by the H&J module of NEWS and the location of editor tabfile. This parameter file must be present for NEWS Jr but the entries other than TFED are ignored. Entries of the type O1\<nn\<10 denote the permissible ranges of entries. The \< symbol here means **less than or equal to**.

| Parameter | Description |
|-----------|-------------|
| TFnn 01\<nn\<16 | Define the names and locations on the PC of the typesetter tabfiles. The entries must observe DOS path conventions. The entry TF01 must always be defined. |
|           | When NEWS initializes its H&J module (the first time the JUST key is pressed) it will open all the typesetter tabfiles defined here. |
|           | The sum of the TF and FF entries must not exceed 7 unless the NTX-OPEN-FILES entry in NDCONFIG is defined. This is described in the Limitations section in the Additional Information chapter. |
| MARKIN   | This should be set to YES if indents should be shown on the screen after H&J. Default condition is NO. |
| JVERS    | This should be set to YES if the user is to be warned when an article justified with a previous version of H&J is |

---

**PI Rev. 901002**
NEWS-N02

---

## Page 13

# Product Information

## Product Name
NORTEXT Editor for Workstation

## Product Number
NEWS N

### ZINCR
Defines the default value of y in the Spaceband Affinity typographic code `<Z x,y>`. Default value when ZINCR is undefined is 0.

This parameter would be defined to reduce the number of successive lines that are hyphenated by the H&J module. Ordinarily, successive lines will be hyphenated as required. However, by increasing the number of character positions from the preferred hyphenation point which may be checked to locate a line-terminating spaceband, it is possible to reduce the number of successive lines that are hyphenated. Normally three character positions are checked. However, this number will be increased on successive lines that have been hyphenated by the number defined by ZINCR.

The setting of ZINCR in this parameter file must match that in the corresponding server file.

### HYnn
This parameter has no function with NEWS.

### GOF_xxxx
These parameters have no function with NEWS. The graphic preview font file required by full versions of NEWS is defined by the NTX-GO-FILE entry in NDCONFIG.

### FFnn 01<nn<10
Define the names and locations on the PC of the global format files. The entries must observe DOS path conventions.

It is not necessary for the definitions to be an uninterrupted sequence but the numbers must correspond to the equivalent definitions in the corresponding server file.

The sum of the TF and FF entries must not exceed 7 unless the NTX-OPEN-FILES entry in NDCONFIG is defined. This is described in the Limitations section in the Additional Information chapter.

### TFED
Defines the name and location of the table file for the editor (normally TABFILED.DAT). The entry must observe DOS path conventions.

### PRO_DESC
This parameter has no function with NEWS.

## Parameter File NTXWFORM.NTX

PI Rev. 901002 NEWS-N02

---

## Page 14

# Product Information

| Product name                 | Product number |
|------------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

This text file contains the parameters which define the user interface in NEWS. Entries of the type 01≤n<10 denote the permissible ranges of entries. The `<` symbol here means less than or equal to.

## Parameters

### L1
Defines the name and location on the PC of the file containing the forms to be used when operating on article records. The entry must observe DOS path conventions.

### L2
Defines the name and location on the PC of the file containing the forms to be used when Y-commands are invoked. The entry must observe DOS path conventions.

### Fn (1≤n<6)
Define new default form names for Display-Article-Record (n=1, default otherwise is IDFORM), Select-Articles (n=2, SELFORM), Catalogue of NORTEXT articles (n=3, CATOUT), and of SINTRAN articles (n=4, CATOUTS), Queue-Contents (n=5, QUEOUT) and Change-Article-Records (n=6, CHAFORM).

**NOTE**: The F3 entry should be set to the name of a standard catalogue (eg F3 = !S) in order that the NORTEXT/CATALOGUE menu option functions correctly.

### ST
Defines the format of the user-definable part of the status line.

### Sn
These parameters have no function in NEWS.

### US
Defines the date and time format to be used. Normally dates are assumed to be entered with the date before the month (eg dd-mm-yy). This order may be reversed by defining this parameter.

### NTX
Defines the default date to be used. If defined the NORTEXT date will be used if no other date is entered. Otherwise, the SINTRAN date is used.

### TIMEOUT
This parameter has no function in NEWS.

### COMPARE
This parameter has no function in NEWS as the compare function is not implemented.

---

PI Rev. 901002  
NEWS-N02

---

## Page 15

# Product Operation

The following information presents a technical overview of the operation of the product. It is provided for installation personnel and system supervisors as an aid to troubleshooting and to provide greater understanding of the product. Information for users, where relevant, is provided in the documentation listed in the product contents section.

## Outline

NEWS provides most of the functionality of the original SINTRAN based NORTEXT editor on a PC. This allows articles to be created and edited locally and stored in a NORTEXT text system running on a remote server. NEWS is capable of operating with SINTRAN, UNIX and XENIX based NORTEXT text systems and may freely switch between the different systems.

## SINTRAN Server Software

NEWS requires appropriate server software to provide both basic communication and some additional services.

Normally communication is via Ethernet and this uses the NORTEXT Access Server. The NAS uses WS-XYNY-500:SEG and its associated parameter file to call Y-server functions from the text system. The USERS entry in this parameter file controls the maximum number of simultaneous connections which are to be maintained by the NAS within the limits of the Ethernet controller.

The NAS provides some services itself including the transfer of NORTEXT articles and SINTRAN files between the server and the PC. Requests for image handling services resulting from the use of the `<MGR>` typographic code are passed to the IMGCPT-PD::DOM program which must be defined as a standard domain. This program is started on an MTAD, by the NAS, when an image is requested either as a SINTRAN file or from the PDB. The IMGCPT program generates the bitmap for the image, and hands it over to the NAS for transfer to NEWS. The server then terminates IMGCPT-PD::DOM and frees the MTAD.

If NEWS is started in `/LOCA` mode, and an article containing an `<MGR>` code is justified, NEWS will initiate a connection to the server defined by OPENLAN-HOSTS-MAINHOST in NDCONFIG before continuing the H&J operation. The attempt to establish this connection will require the user to enter a valid username and password if these have not been defined in NDCONFIG.

If NEWS is used via a serial connection (after a [illegible] log-in has been...

---

### Footer
PI Rev. 901002                                                                    NEWS-N02

---

## Page 16

# Product Information

| Product name                       | Product number |
|------------------------------------|----------------|
| NORTEXT Editor for Workstation     | NEWS N         |

completed) the OWS-SERVER-A or OWS-LINE-B re-entrant subsystems on the server are used for communication with the NORTEXT text system. The program is started on the device to which the user is connected, and will be terminated when NEWS disconnects from the host.

The particular sub-system used on the host is controlled by the version of CONNECT used on the PC. Version A27 of CONNECT will start OWS-SERVER-A whilst version B00 will start OWS-LINE-B. It is possible to run both sub-systems simultaneously.

## Starting NEWS

If NEWS is started without any modifiers, and the entry OWS-COMMS-MEDIUM=Ethernet is found in NDCONFIG, the user will be prompted for the name of the NORTEXT text system to which connection is required. It is possible to specify /LOCA at this point to use NEWS in local mode.

Once connection to the NORTEXT Access Server (NAS) on the specified server has been established, NEWS will attempt to log-in using the username and password given by the NDCONFIG entries NTX-OPENLAN-USER and NTX-OPENLAN-PASSWORD. If this fails, or one or more of the entries are undefined, the user will be prompted for username and password. In the case of connection to a SINTRAN server the username and password will be interpreted as either SINTRAN or UE depending on the setting of the UE-CHECK option in NAS-SERVICE. The NORTEXT profile used (either SINTRAN or UE) will is also controlled by this setting.

**NOTE:** Only the profile (i.e. SINTRAN or UE) which matches the NAS UE setting is checked when a user attempts to log-in. A user will not be allowed access to the system if they do not have a UE profile when NAS is in this mode **EVEN IF THEY ARE A VALID SINTRAN USER.**

If the *Y-DEFAULT* command is used, NEWS will first try to log into the new system using the current username and password. If this fails the user is prompted for a valid combination.

No host system will be prompted for if NEWS is started with a serial connection (OWS-COMMS-MEDIUM=Serial) as, in this configuration, a UE login is required prior to starting NEWS.

The NTX-OPENLAN-USER and -PASSWORD entries must be defined (but need not contain valid entries) when NEWS is used with a prior UE log-in to a host. If these entries are NOT defined, the user will still be prompted for User Name and Password when starting NEWS although they already have a connection to the host.

PI Rev. 901002                                 NEWS-N02

---

## Page 17

# Product Information

| Product name                    | Product number |
|---------------------------------|----------------|
| NORTEXT Editor for Workstation  | NEWS N         |

## Modifiers

- **/LOCA**
  - will automatically start NEWS in local mode without prompting the user.

- **<Host>**
  - will automatically attempt to connect to the text system on server \<Host> without prompting the user. If connection cannot be established NEWS will terminate.

- **,,**
  - will automatically attempt to connect to the text system on the server currently defined by OPENLAN-HOSTS-MAINHOST in NDCONFIG.

- **%**
  - will clear the NORTEXT region of the BMS scratch file and consequently initialize the editor. It will **NOT** delete the scratch file or modify any other regions.
  - **NOTE**: This option is only valid if a host, /LOCA, or ,, has already been entered on the command line.

- **/TEST**
  - will present on-screen diagnostics whilst NEWS initializes.

---

## Page 18

# Product Information

| Product name         | Product number |
|----------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N          |

# Product History

Changes in the most recent version are listed first in each section.

Version N02 contains the following software versions:

- NEWS  - N08
- NHC   - 
- NTXMENU -

Version N01 contained the following software versions:

- NEWS  - N03
- NHC   - 
- NTXMENU -

# New Functions/Commands

## Version N02

- The use of User Environment is now supported. When the NAS is set to use UE mode, all names and passwords are treated as applying to UE and the UE NTX profile is used.

## Version N01

- To log out from the NORTEXT text system and the host system, without leaving NEWS, use the Y command `/LOCA`.

- To activate the Dial Up function, use the Y command `@(filename)`. Please consult the appendix in the "NORTEXT Editor for Work Station" manual, document no. 861071.

- Two new Y-commands, `/MGRO` and `/MGR1`, are introduced to toggle the viewing of pictures from the `<MGR>`-code. If turned off by issuing the Y `/MGRO` command, only the picture boarders are shown as an envelope. To turn viewing on, use the Y `/MGR1` command. At startup, viewing is turned on as default.

# Changed Functions/Commands

## Version N02

None.

---

PI Rev. 901002

NEWS-N02

---

## Page 19

# Product Information

| Product name            | Product number |
|-------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

## version N01

- For NEWS Jr., pressing the `<JUST>` key will compute the number of characters, words and lines in the article, and store these values in the following article record fields:

  ```
  Characters : CNTX
  Words      : WRDX
  Lines      : LINX
  ```

  If `<JUST>` is pressed while inside the text, the computation will only be done for the paragraph where the cursor is located, and the article record will not be updated. The number of words will be displayed in the text region, but not saved as part of the text.

  No justification will take place.

- If the editor is started with the `/LOCA` option, NEWS will have no contact with the host machine whatsoever. In previous versions /LOCA just disabled logging into the NORTEXT textsystem, whilst SINTRAN III access was still possible.

## Removed functions/commands

None.

## Other modifications

### version N02

None.

### version N01

- When accessing a remote system with no legal user name and/or password defined in NDCONFIG, NEWS will prompt for correct user-name and password until a successful login or no user name is entered.

  If the login fails during startup, the NEWS session will be terminated. If the login fails when executing the Y command DEFAULT, NEWS will continue in LOCAL mode with no access to any remote system until a successful login is made.

- If NEWS is used in LOCAL mode and the `<JUST>`-key is pressed while the text contains the `<MGR>` code, the operator is asked to enter correct user name and password for the host system if the entries are available.

```
    [Logo: ND Comtec]
```

PI Rev. 901002                              NEWS-N02

---

## Page 20

# Product Information

| Product name                  | Product number |
|-------------------------------|----------------|
| NORTEXT Editor for Workstation| NEWS N         |

---

NTX-OPENLAN-USER and/or NTX-OPENLAN-PASSWORD defined in the file \ND-OWS\NDCONFIG are undefined or contain wrong values.

- Now able to access a UNIX filesystem.

## Errors corrected

### version N02

- String parameters now passed correctly in format calls.
- The maximum number of deferred formats is now the same as for the 500 editor and functionality has been corrected.
- Stack overflow no longer occurs with Y commands.
- Abort of NORTEXT line(s) with the Y command "LINE-STATUS `<line>` !"
- Large UDK sets now saved correctly and the entry in NDCONFIG is correctly observed.
- Supershift characters may now be used with Get and Substitute functions.

### version N01

- "Random dots" in typographic preview.
- Use of BIG text blocks allowed. BIG blocks are default on Ethernet, while SMALL blocks are default for RS232.
- Error in the `<WL>` code in special circumstances.
- FOCUS fields USD5 and USD6 corrected.
- Catalog output with COMPUTED fields.
- The modifiers ALL, MARKED, UNMARKED allowed in the Y command CAT.
- Improved recovery of text if it is not enough free space on disk for the BMS-scratch file.
- Stopping of NORTEXT line(s) with the Y command "LINE-STATUS `<line>` -"
- Improved DOS critical error handling.
- Catalogues across two text files now correct.

---

PI Rev. 901002     
NEWS-N02

---

## Page 21

```
 _______________________ 
|                       |
|  ND      Product      |
|  Comtec  Information  |
|_______________________|

Page 21 of 38

Product name

NORTEXT Editor for Workstation

Product number

NEWS N

Errors known but not corrected

- The entry VTM-ND-INT in NDCONFIG must be set to 66H.

- For correct operation, the entry NTX-GO-FONT in NDCONFIG must be set
  to NTX-GO-FONT=C:\ND-OWS\NTX-WP\NEWSxxx?.FON where xxx is either
  EGA, VGA, CGA or WY7.

- The entries NTX-INIT and NTX-STXT in NDCONFIG should look like those
  shown below if the relevant functions are to operate in accordance
  with the manual.

    NTX-INIT= I:;c:\nd-ows
    NTX-STXT= I:;c:\nd-ows\ntx-wp,!STX
    s\ntx

STXT searches the path when reading, but always writes to the current
directory. The extension is honoured for both read and write.

INIT searches the path when reading, and always writes to the first
directory in the search path. The extension specified in NDCONFIG is
used when reading, but an INIT file always has the extension INI when
written.

NTX-TEXT is not in use, and may be omitted from NDCONFIG.

                         PI Rev. 901002              NEWS-N02

Scanned by Jonny Oddene for Sintran Data © 2021
```

---

## Page 22

# Product Information

| Product name                 | Product number |
|------------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

---

## Additional Programs Delivered

The following programs are included with this product.

### 1 NORTEXT Host Check (NHC.EXE)

#### Description

NHC performs an unattended check of the availability of different NORTEXT hosts on an Ethernet network. The host names are defined in the `\ND-OVS\COMMS\HOSTS` file and NORTEXT hosts are those for which there is an entry 'NORTEXT-' in the available port list. The first available host will be set as the current host by an appropriate definition of the OPENLAN-HOSTS-MAINHOST entry in the NDCONFIG file.

Note that the entry OPENLAN-HOSTS-MAINHOST= must be present in NDCONFIG prior to starting NHC.

In the absence of any command line parameters, NHC first checks whether the host currently defined by OPENLAN-HOSTS-MAINHOST in NDCONFIG is available. If this fails, the NORTEXT hosts defined in the HOSTS file are checked in the order they occur in the file. Once a suitable host is found, the OPENLAN-HOSTS-MAINHOST entry in NDCONFIG is updated.

NHC uses two methods to establish the status of a host. The default is to issue a message to the host and then wait up to 3 seconds for the reply. This reply is sent by the RT program PCECHO supplied as part of NORTEXT Basic Real Time. Normally PCECHO only replies when the NORTEXT textsystem is available. The second method is to establish communication with the NORTEXT Access Server (NAS). It is necessary to allow 40 seconds for a reply to be received from the NAS.

#### Command Line Modifiers

- **NHC ?**

  Prints a summary of options on the screen.

- **NHC /HOST=name1, name2, name3 ...**

  Checks the current OPENLAN-HOSTS-MAINHOST then the specified host(s) in order they are given on the command line and, if no connection is found, continues with the hosts defined in the HOSTS file.

- **NHC /ALL**

  Checks the current OPENLAN-HOSTS-MAINHOST then *ALL* the NORTEXT hosts.

---

PI Rev. 901002

NEWS-N02

---

## Page 23

# Product Information

| Product name | Product number |
|--------------|----------------|
| NORTEXT Editor for Workstation | NEWS N |

## Networking Configuration Commands

### NHC /HOST=name1 ... /ALL

Checks the current OPENLAN-HOSTS-MAINHOST then the specified hosts and finally all remaining NORTEXT hosts defined in the HOSTS file. The first available host will be defined as the default host, but the current status of all hosts will be displayed.

### NHC /HOST=name1 ... /ONLY

Checks the current OPENLAN-HOSTS-MAINHOST then the specified hosts in the order they are given on the command line. No other hosts will be checked. The /ONLY switch is relevant only if /HOST= is specified, and will override any /ALL switch.

### NHC /TIME=x

Will cause NHC to continue checking the connection to each host for x seconds before the host is regarded as unavailable. If /TIME is not specified, the timeout defaults to 3 seconds.

### NHC /NAS

Will cause NHC to skip the quick PCECHO test, and instead check connections using the NAS server on the hosts. If /NAS is used, NHC may wait for up to 40 seconds if the host is not available due to power failure, defect cable, hardware failure, or if the NAS is not running. If the host is not available for any other reason, the check will take about the same time as a PCECHO type check.

If the /NAS option is not used, the quick check using PCECHO will take no more than 3 seconds unless this timeout has been altered using the /TIME option. Normally, the PCECHO check will take less than 1 second for each host.

### NHC /NAS_PING

Will cause NHC to initially check the connection using PCECHO and then, if connection is established, proceed to verify the connection by establishing communication with the remote NAS server. The PCECHO and the NAS test must complete successfully for the host to be selected.

---

**PI Rev. 901002**

**NEWS-N02**

---

## Page 24

# Product Information

| Product name                | Product number |
|-----------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

## Completion Codes

On exit from NMC, the DOS ERRORLEVEL is set as follows:

- **Errorlevel = 2**: A new host is defined as default host.
- **Errorlevel = 1**: Default host is available, no change done.
- **Errorlevel = 0**: No host where available, no change done.

The NDCONFIG file is only updated if ERRORLEVEL=2.

## 2 NORTEXT Menu (NTXMENU.EXE)

NTXMENU provides an environment from which other DOS applications may be started. The program provides no functions itself and is intended to be customised by the system supervisor. The menu options are configured using two parameter files, NTXMENU.MSG and NTXMENU.DEF. These files must be located in the directory specified by the environment variable ND-OWS.

### Parameter file NTXMENU.MSG

This file contains all language-dependent text strings that are used by the program, including error messages and optional user-defined header text. This file may be edited as required using any PC text editor or the MENUEDIT program.

### Parameter file NTXMENU.DEF

This file contains the menu entries and the information required to start the corresponding programs. A maximum of 40 program definitions may be entered. This file also contains a number of parameters which can be used to alter the operation of the menu program.

In the NTXMENU.DEF file, any non-blank line that is NOT started with a comment sign (%) or a configuration parameter sign (*) will be interpreted as a program definition. The syntax of the program definition lines is:

```
<menu text> ; <full path to the program> ; [working directory]
```

The last parameter is optional. If a working directory is specified, NTXMENU.EXE will move to this directory before the application is started. If not, the application is started from the directory from which the menu program itself was started.

In order to start a batch file (.BAT) from the menu, the setting of the DOS environment variable COMSPEC must be included in the

---

PI Rev. 901002

NEWS-N02

---

## Page 25

# Product Information

**Product name**  
NORTEXT Editor for Workstation

**Product number**  
NEWS N

---

menu program name.

## Example:

To start a batch file called `DO-IT.BAT` from `c:\user`, specify:

```
Do This; c:\command.com /c DO-IT.BAT; c:\user
```

The following parameters may be included in the `NTXMENU.DEF` file and the effects stated.

| Parameter | Description |
|-----------|-------------|
| `^x` | This option must be included to allow the user to terminate the menu program with the F10 key. When the program is terminated in this way the value of `ERRORLEVEL` is set to 10. |
| `^DOS` | This option must be included to allow the user to enter DOS commands (after pressing the F2 key) whilst remaining in the menu program. This is implemented by starting a new command processor. The user returns to the menu program by typing the DOS command `exit`. |
| `^J` | The effect of this parameter is that the user-defined text messages (see `NTXMENU.MSG`, messages 2 - 8) are centered on the screen. Default is left justification. |
| `^R` | If this parameter is specified, `NTXMENU` will try to start any program whilst staying resident in memory. If there is not enough memory, `NTXMENU` will terminate upon starting the program. If `^R` is not specified, `NTXMENU` will always terminate upon starting the program. This parameter is discussed further at the end of this section. |
| `^Tn` | The program will, by default, display the current date and time in the upper right corner of the screen. When the keyboard has been left untouched for ten minutes, the clock times out to avoid refreshing of the screen. It will be updated next time a key is pressed. The `^Tn` parameter sets the timeout time in minutes where `n` is the number of minutes. If `n` is set to zero, no date or clock is displayed. If `n` is set to 60 or higher the clock will never time out. |

The following five parameters control the colours used by the program.

| Parameter | Description |
|-----------|-------------|
| `^W` | This parameter should be used when the program is run on a | 

---

**PI Rev. 901002**  
**NEWS-N02**

---

## Page 26

# Product Information

**Product name**  
NORTEXT Editor for Workstation

**Product number**  
NEWS N

---

PC with B&W screen. The screen colours will be set to appropriate values; all other colour settings will be ignored.

- **Bn** - sets the general background colour.
- **Mn** - sets the colour for the menu frame and command prompt.
- **Cn** - sets the colour for the user defined text strings, the menu numbers, and the date and time entry.
- **En** - sets the colour for the error messages

The colour for the menu entries and the status line information will be the inverse of the selected background and menu frame colours.

**n is the colour value according to the following list:**

| Colour    | Value    |
|-----------|----------|
| black     | 0 (8)    |
| blue      | 1 (9)    |
| green     | 2 (10)   |
| cyan      | 3 (11)   |
| red       | 4 (12)   |
| magenta   | 5 (13)   |
| brown     | 6 (14)   |
| white     | 7 (15)   |

The numbers in parentheses give a brighter colour variant but are not valid for the background colour.

---

If option "R is not used or if there is not enough memory to keep the menu program resident in memory while another application is running, the application returns to DOS upon exit. To make this transparent to the user the following commands should be included either in AUTOEXEC.BAT or in an appropriate batch file used to invoke the menu program.

```
:loop
ntxmenu
if errorlevel 10 goto end
goto loop
:end
```

The initialisation of NTXMENU.EXE is very fast and it appears to the user as if control is returned directly to the menu. If this mode of operation is used message no. 15 in the file NTXMENU.MSG should be removed.

## The MENUEDIT.EXE Program

This utility program allows the two configuration files (NTXMENU.DEF and NTXMENU.MSG) used by NTXMENU to be edited. If MENUEDIT.EXE is started without any parameters, abbreviated instructions will be provided.

PI Rev. 901002

NEWS-N02

---

## Page 27

# Product Information

| Product name                       | Product number |
|------------------------------------|----------------|
| NORTEXT Editor for Workstation     | NEWS N         |

---

NTXMENU.EXE uses a standard IBM PC 8-bit character set. Consequently, NTXMENU.DEF and NTXMENU.MSG must be edited with a standard PC editor if nationality specific characters are used. This simple program is useful for installations that do not have such an editor.

If MENUEDIT.EXE is started directly from NTXMENU (i.e. is specified in NTXMENU.DEF) any changes in the menu will be implemented immediately.

---

**PI Rev. 901002**

**NEWS-NO2**

---

## Page 28

# Product Information

| Product Name                       | Product Number |
|------------------------------------|----------------|
| NORTEXT Editor for Workstation     | NEWS N         |

## Other Information

You should be aware of the following additional information.

### Limitations

- The maximum number of files which NEWS will be required to open must, under some circumstances, be specified.

  If the parameter "FILES=" in CONFIG.SYS is set to the value 20 (which was the maximum number of open files in versions of MS-DOS prior to 3.3) then the sum of typesetter files and format files in NEWS must not exceed 7.
  
  In later versions of MS-DOS the number of files may be increased. However, the parameter NTX-OPEN-FILES=xxx must then also be defined in the NDCONFIG file. The number xxx may be calculated by adding 13 to the sum of the number of typesetter and format files defined in NTXWPARA.NTX. This new value is then the maximum number of open files, and should be used both for "FILES" in CONFIG.SYS, and for NTX-OPEN-FILES in NDCONFIG.
  
  The maximum permissible number for NTX-OPEN-FILES is 30. This allows up to 7 typesetter tabfiles to be defined if the maximum of 10 format files are required.
  
  Error messages typical of an attempt to open too many files are:

  ```
  107B : Attempt to open too many files
  127B : File number out of range
  ```

- Limitations in the screen drivers for WYSE-700 and CORNERSTONE screens mean that it is not possible to change the shape and attributes of the NEWS cursor for these devices. The cursor will be visible also when viewing an article in typographic preview.

- SINTRAN file access from NEWS is possible only when you have logged into ND host **before** the NEWS session is started.

- NORTEXT on ND-100 can only be accessed with serial communication.

- NORTEXT M release on ND 500(0) is required for Ethernet access.

- The LOG command (to read NORTEXT log files) will only work with Ethernet communication, and NOT with serial communication.

- FOCUS Version H forms MUST be used on NEWS.

---

PI Rev. 901002

NEWS-N02

Scanned by Jonny Oddene for Sintran Dac © 2021

---

## Page 29

# Product Information

## Product Name
NORTEXT Editor for Workstation

## Product Number
NEWS N

---

## Applies to NEWS with H&J Only

- The names of global formats are stored in a directory, which is searched whenever a global format is referenced. The size of this name directory may not exceed about 40,000 bytes. This is sufficient for a directory of 1200 - 1300 names. The number of bytes in the directory is listed by the LOAD-LAMU program and in the LAMU-DIRECTORY:LIPC file produced by this program.

- The MGR code uses the image server IMGPCRT-PD-:DOM on the host. The image server must be located on the same system (machine) as the NORTEXT text system. However, if a Picture DataBase is used, it may be configured for access from a remote system.

- The MGR function is not available with serial communication.

- The following codes concerning colours may be used in NEWS, but definition and fetching of defined colours will not work. These codes will, however, not be marked as errors. The codes are:

  ```
  DEFC - Define screen colour.
  GETC - Get colour.
  SETC - Set colour.
  AREA - Set colour area.
  DEFB - Define border.
  ```

## Not Implemented

- The Y command SOFTSCROLL.
- The E-ADS commands and MAGGY-fields for setting up classified advertisements.
- The PG command (Book Pagination is not available for the PC).
- The compare function.
- The functions for broadcasting media.
- Spell checking (will be developed).
- Home command "ampersand" (&), used to create an initialized editor.
- The article record fields USD0 and USD4.
- SORT of catalogues.
- Partial justification. The whole article will always be justified.

---

PI Rev. 901002

NEWS-N02

---

## Page 30

# Product Information

| Product name                         | Product number |
|--------------------------------------|----------------|
| NORTEXT Editor for Workstation       | NEWS N         |

- The F3 key used to toggle between alphanumeric and graphic display is not implemented because of screen hardware limitations.

- Inverse display in typographic preview is not implemented other than for images. However, the foreground colour may be specified.

```
 ___ 
|ND |
|Comtec|
```

Page 30 of 38

PI Rev. 901002

NEWS-NO2

---

## Page 31

# Product Information

**Product name:** NORTEXT Editor for Workstation  
**Product number:** NEWS N

## Optimising performance

The following notes are intended to provide some guidance when configuring PCs for optimum performance when using NEWS. The majority of the comments are only relevant to full versions of NEWS.

ND Comtec A.S assumes no responsibility for any errors that may appear in this section, or for the use or reliability of its software on equipment that is not furnished or supported by ND Comtec A.S.

Remember to reboot your PC after each change in CONFIG.SYS and/or AUTOEXEC.BAT to activate the changes.

## NEWS Jr.

The performance of NEWS Jr. is largely unaffected by variations in system configuration as it does not have an H&J module. Any memory available after the HIMEM.SYS driver has been installed should be used to provide a disk cache to improve overall performance and reduce wear and tear on the disk drive. The BUFFERS entry in CONFIG.SYS should be set in the range 5 to 15 with the higher values of greater benefit if no cache is available. Each buffer reduces DOS memory by 528 bytes.

## Full versions of NEWS

The performance of NEWS during any operation other than H&J is, like NEWS Jr., largely unaffected by variations in system configuration. However, most users judge the 'speed' by H&J performance and this is directly related to the PC memory configuration. In general, the more memory the PC has, the faster NEWS will potentially operate. Maximum performance will usually be obtained with 3Mb of additional memory.

## Memory requirements

The first requirement is that the PC should have at least 640Kb DOS memory and 64Kb extended memory. The extended memory is required by the HIMEM.SYS driver which should be installed via the CONFIG.SYS file. The second requirement is that some memory should be available for use as a disk cache using SMARTDRV (supplied with Windows) or some similar program. On basic PCs equipped with a total of 1 Mb arranged as 640Kb plus 384Kb extended memory, this cache can use the 320Kb of extended memory left after installing HIMEM.SYS. It is important that the size of the disk cache when added to the 64Kb required by HIMEM does not exceed the amount of extended memory available.

An increasing number of machines have an option to use additional memory to improve performance by copying the ROM and/or video BIOS.

---

PI Rev. 901002  
NEWS-N02

---

## Page 32

# Product Information

| Product name                | Product number |
|-----------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

## RAM

Higher performance is likely to be obtained from NEWS by disabling this feature and using all 320Kb as a cache. There will be no improvement in NEWS performance by copying either the EGA or VGA BIOS to RAM. It is important to ensure that sufficient DOS memory remains to run NEWS after cache and other disk utilities have been installed and CONFIG.SYS parameters have been set. The amount of memory required by cache programs will vary with the size of the cache.

## Additional Memory

If additional memory is installed in the PC, justification speed will be increased. Sufficient memory should be allocated as expanded memory to satisfy the requirements given below for storing the LAMU file. Remaining memory should generally be used as disk cache unless the PC is equipped with a particularly slow hard disk, in which case some memory should be used to provide a RAM disk for the scratch file.

On PCs equipped with 386 and 386SX processors all memory should be installed as extended memory and controlled using 386MAX or a similar program. This allows the ratio between extended and expanded memory to be controlled by software. The only circumstance with these processors under which additional memory could be installed as (hardware) expanded memory might be to use existing memory cards before the system board had been fully populated with RAM.

## Expanded Memory

If sufficient expanded (EMS) memory is detected when the JUST key is pressed for the first time, NEWS will load the LAMU file into this memory. This will lead to a substantial increase in hyphenation speed especially for languages with many exception words. The EMM (Expanded Memory Manager) driver for the memory card you are using must be correctly installed before using NEWS.

On PCs equipped with 386 and 386SX processors expanded memory is implemented via paging registers on the microprocessor. The use of this function requires an expanded memory emulator of the type provided by using 386MAX and QEMM-386, although many manufacturers also include suitable utilities with their 386 machines. These 386 specific emulators should not be confused with the low performance versions available for 286 processors.

The amount of expanded memory (in KBytes) needed by NEWS is found from the following formula:

\[ \text{(Sum of the LAMU file in pages + 12) times 2} \]

---

PI Rev. 901002

NEWS-N02

---

## Page 33

# Product Information

**Product name**: NORTEXT Editor for Workstation  
**Product number**: NEWS N  

---

The sum of LAMU file in pages can be found at the end of the file `(SYSTEM)LAMU-DIRECTORY:LIPC` on the host. Typically around 100Kbytes would be required.

If the EMM driver is not installed, or there is not enough unallocated space in the Expanded memory to hold the LAMUs, NEWS will read the LAMUs from file when needed. The only way to check that NEWS is using expanded memory, is to compare the time used to H&J an article with a many hyphenations with and without the EMM driver installed. There should be a noticeable difference.

## Buffers

The number of BUFFERS defined in the CONFIG.SYS file provides a second level of caching based on disk sectors. The optimum number of buffers for a particular configuration is difficult to predict but 8 to 10 is likely to be best for a system that also uses a disk cache. Each buffer reduces the available DOS memory by 528 bytes.

## Disk drives

The performance of NEWS in system configurations with less than 3Mb of additional RAM is also affected by the speed and type of hard disk installed. In general the larger the disk capacity the faster access time it has. The worst performance is obtained with machines with 20Mb disks which often have an access time of 75ms. A 40Mb disk will typically have an access time of 28ms. Consequently, the best NEWS performance will be obtained by using some additional memory in a PC with a fast disk.

## Adding memory to 286 based PCs

Memory above the basic 1Mb may be used to enhance the performance of NEWS. Additional memory up to about 2.5 to 3Mb should be installed as expanded (EMS) memory on 286 machines. If further memory is available this might be added as extended memory.

## Configuration suggestions

The following configuration recommendations assume that NEWS is the principal application running on the PC. If this is not the case then the best compromise will probably be achieved by allocating sufficient expanded memory for the LAMU file and operating with a reasonable size cache. The following recommendations also assume that a disk cache of at least 320Kb has already been installed. Improved performance is also likely to be obtained by increasing the size of this cache if

---

PI Rev. 901002  
NEWS-N02

---

## Page 34

# ND Comtec Product Information

**Product name**: NORTEXT Editor for Workstation  
**Product number**: NEWS N

---

## 1 Maximising Available DOS Memory

The latest versions of NEWS require significantly less DOS memory than earlier versions. However, it is still wise to maximise the use of the DOS memory. This can be achieved with the aid of the following guidelines.

Terminate and Stay Resident (TSR) programs loaded via AUTOEXEC.BAT should be loaded before defining the DOS path. This can be achieved by specifying the full path to the program in AUTOEXEC.BAT.

It may be possible to reduce TSR memory requirements by changing the loading order but with one exception the effort is rarely worthwhile. The exception is that when SMARTDRV.SYS is to use extended memory it should be loaded after HIMEM.SYS but before the EMS driver. The reason for this is that SMARTDRV.SYS requires much more memory if it is installed after an EMS driver even though it is configured to use extended memory. An EMS (or any other) driver must always be loaded before any software which uses it.

The following table lists the TSR programs which must be loaded prior to using NEWS and gives an approximate indication of their size in Kb. The table is followed by an indication of the size of other TSR's which may be used in connection with NEWS.

| Resident Program               | Memory Requirement (kB) | Notes       |
|--------------------------------|-------------------------|-------------|
| MS-DOS                         | 50                      | size varies |
| HIMEM.SYS                      | 3                       |             |
| Connect (Ethernet)             | 36                      | (1)         |
| Connect (Serial)               | 40                      | (1)         |
| Ilana - PCSDRV.EXE (Ethernet)  | 24                      | (1)         |
| NDSCREEN.EXE (EGA or VGA)      | 16                      | (2)         |
| NDSCREEN.EXE (WY700 or Cornerstone) | 46                  | (2)         |
| Keyboard drivers               | 10                      | size varies |
| VKM keyboard driver            | 2                       |             |
| EMS driver                     | 12                      | size varies |
| RAMDRIVE.SYS                   | 15                      |             |
| BRATDISK.SYS                   | 3                       |             |
| SMARTDRV.SYS                   | 15                      | (3)         |

**Notes:**

1. The combination of these programs loaded depends on the type of connection to the host.

---

PI Rev. 901002  
NEWS-N02

---

## Page 35

# Product Information

**Product name:** NORTEXT Editor for Workstation  
**Product number:** NEWS N

---

(2) The version of NDSCREEN loaded depends on the type of screen used with the PC.

(3) The memory requirements of SMARTDRV vary but this value corresponds to an extended memory cache of up to 0.5Mb.

## Typical Memory Usage in Kbytes for Common Configurations:

|        | EGA / VGA |         | WY700 / 19" |         |
|--------|-----------|---------|-------------|---------|
|        | Used      | Free    | Used        | Free    |
| ETHERNET | 141     | 499     | 171         | 469     |
| SERIAL   | 121     | 519     | 151         | 489     |

The EMS driver, BRATDISK, SMARTDRV and RAMDRIVE are not included in these figures.

The "Free" column lists DOS-memory available to NEWS. The amount of memory required by each version of NEWS is given in the Requirements section.

## 2. RAM Disk

On PCs with slow hard disks a substantial improvement in performance can often be obtained by creating a RAM disk for the scratch file and possibly for NEWS itself. At least 0.5Mb of additional memory is required for the scratch file and, if required, a further 1.5Mb for NEWS. Generally RAM disks operating in expanded memory are faster than those in extended memory when using 286 based PCs. It is necessary to change the UE-BMS entry in NDCONFIG to correspond to the RAM drive when using this for the scratch file.

There are two consequences that should be borne in mind when using a RAM disk for the scratch file. The first is that it may not be possible to recover the current article if the PC crashes whilst running NEWS. The second is that the size of the RAM drive, and hence the scratch file, limits the maximum size of the article that may be edited. This size will be reduced if many regions are used simultaneously. An error message is given if the scratch file becomes full whilst editing and the user is returned to DOS. However, the article is maintained in the scratch file and may usually be saved after restarting NEWS.

---

PI Rev. 901002  
NEWS-N02

---

## Page 36

# Product Information

| Product name                   | Product number |
|-------------------------------|----------------|
| NORTEXT Editor for Workstation | NEWS N         |

A batch file should be created to copy the scratch file to the RAM disk before starting NEWS and copy it back to the hard disk on exit. Under many circumstances the performance gains obtained by using a RAM drive for the scratch file greatly outweigh the potential disadvantages.

The BRATDISK.SYS utility supplied with the BOCARAM memory cards in some Comtec PCs gives superior performance to that obtained using the RAMDRIVE.SYS driver. The BRATDISK driver is also capable of maintaining the contents of the RAM disk when the PC is rebooted.

The hard disks fitted to 386 and 386SX based PCs are usually substantially faster than 28ms and there is little advantage to be gained by using a RAM disk with these machines. However, the 386MAX software includes a RAM disk utility if it proves advantageous to operate NEWS in this manner.

## 3 Placing LAMU file in expanded memory

If sufficient expanded memory is available it will automatically be used by NEWS to improve hyphenation performance. This is achieved by loading the format name directory (if used), hyphenation rules and exception words contained in the LAMUSNTX.DAT file into EMS. This greatly enhances the speed with which hyphens may be inserted by removing the need to page this information from file. The LAMUSNTX.DAT file is closed once the information is transferred to EMS. This has the incidental advantage of increasing by one the number of format and typesetter files which may be simultaneously opened.

The amount of expanded memory that is required to use this feature is in the region of 100 to 200Kb depending on the size of the hyphenation rules and exception words. Some of this memory is also used to improve typographic preview performance by buffering the screen font files.

## 4 Organising the hard disk

To following guidelines are intended to maximise performance of your hard disk.

- The partitions on the disk should not be greater than 32MB.
- Use many "small" directories rather than few "big".
- Choose as flat a directory structure as possible.
- If you want to copy on multiple directories, create any missing directories *before* copying.

PI Rev. 901002 NEWS-N02

---

## Page 37

# Product Information

| Product name                     | Product number |
|----------------------------------|----------------|
| NORTEXT Editor for Workstation   | NEWS N         |

- Use Norton's Directory Sort, or similar, as often as possible.

- Use a disk optimizer, such as Norton's Speed Disk, periodically if you have made many changes on your hard disk, i.e. deleted, created or expanded a number of files. Normally, running Speed Disk once a week will be sufficient.

- Whenever you format a hard disk, make sure you select the best interleave factor for that disk.

```
 ________________________
| ND                     |
| Comtec  Product Information   |
|________________________|
```

| Page 37 of 38 |

PI Rev. 901002 NEWS-N02

[Scanned by Jonny Oddene for Sintran Data © 2021]

---

## Page 38

# Product Information

| Product name                          | Product number |
|---------------------------------------|----------------|
| NORTEXT Editor for Workstation        | NEWS N         |

## Questionnaire

************ HELP YOURSELF BY HELPING US!! ************

Did you have any problems understanding this PI-sheet?  
Is there any other information that you require?  
Have you found any errors?

Please let us know!

Make your comments on this page and mail it to:

```
ND Comtec R&D
N-7004 Trondheim
NORWAY
```

**Your Comments:**

---

PI Rev. 901002

NEWS-NO2

---

