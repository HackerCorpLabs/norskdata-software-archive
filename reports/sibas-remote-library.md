# SIBAS remote-library sources: XMSG / COSMOS question

Source material: the SIBAS tar floppies (sib1, sib2) — two v7 tar volumes written straight to
floppy media, 1,182,720 bytes each. Not imported into this archive at the time of writing.
Everything below was read out of the extracted files; nothing was written back to the media.

## Short answer

- **XMSG: no.** No XMSG call, constant, structure, comment or symbol exists anywhere in the
  sources, the headers, or any of the six object libraries.
- **COSMOS: no.** No COSMOS reference, no LLC/802.3 framing, no XROUTE, no CONNECT-TO,
  no ND-NET. The `Naa*` names are the only ND-network-sounding thing present and they sit
  directly on top of BSD sockets.
- **Transport actually used:** BSD sockets over TCP/IP — `socket()`, `connect()`, `write()`,
  `read()`, `close()`, `htons()`, with the server host looked up in `/etc/hosts` and the
  service port in `/etc/services`.

## 1. What is on the two floppies

Both volumes carry the same tree; sib2 is the later and larger of the two.

sib1 (12 files):

    tst/Makefile  tst/askdb.c  tst/dbnam.c  tst/stress.c  tst/tst2.c
    tst/tstdv.c   tst/version.c  tst/wide.c
    inc/sibrlib.h  inc/sinfo.h
    sibrlibB3Com.a  sibrlibBExc.a

sib2 (15 files): the same `tst/` and `inc/` trees plus

    sibrlib.a  sibrlibB3Com.a  sibrlibBExc.a  sibxlib.a  sibxlib.h  sibxlib.imp

In sib2 the tar header for `sibrlibBExc.a` is a **hard link to `sibrlib.a`** (tar type `h`),
which is why the two have the same MD5. tar member timestamps run 1990-03-05 to 1990-10-30,
uid 201, gid 50.

The `tst/*.c`, `tst/Makefile`, `inc/sinfo.h` files are byte-identical between the two volumes
except `tst/stress.c` (sib1's copy is the newer, 1990-10-02, and adds the `Intel 386` and
`88K RISC` CPU cases and an extra `SFRLM` call). `inc/sibrlib.h` differs: sib1's copy is
prototyped with `extern` + a `NOARGS` fallback, sib2's copy adds `UNIX` fixed-width typedefs
(`int1/int2/int4/uns1/uns2/uns4/real4`) and a `SUN` fallback.

## 2. XMSG — none

Searched every `.c`, `.h`, `.imp` file and the raw bytes of all six `.a` files for
`XMSG`, any `XM`-prefixed identifier, `XMOPEN`, `XMSEND`, `XMRECEIVE`, `XMPUT`, `XMGET`,
`XMCONNECT`, `XMDISCONNECT`, "port", "letter box", MON.

Result: zero hits. The only `XM` substring in the entire material is `SEXMC`, one of the SIBAS DML
routine names (the header gives no gloss for it, so what it does is unknown from this
material), and `xmotion`, a member of a `mouseinfo` struct that came in from a system header pulled into
`sibxlib.a`'s CodeView debug type table. Neither is XMSG.

There is no MON call, no SINTRAN reference and no ND-100/ND-500 code anywhere in the libraries.
The only mention of an ND machine is a *status value the client decodes*, in `tst/tst2.c:121`:

    else if ( stat == 500 ) printf(", server is an ND500(0) Cpu.\n");

and in `tst/tstdv.c:125-127` the same test plus `386` → "Intel386 Cpu" and `88` → "Uni88K Cpu".
That is the client asking a remote SIBAS what CPU it runs on; it is not an XMSG interface.

## 3. COSMOS — none

No `COSMOS`, `NAACONNECT` (as an ND protocol), `XROUTE`, `CONNECT-TO`, `TRANSPORT-SERVICE`,
`ND-NET`, `LLC`, `802`, `Ethernet` string exists in any file.

The `NAA` names Ronny flagged are real but they are ordinary C functions in `sibrlib*.a`,
all defined in the module `NaaInt.o` (compiled from `NaaInt.c`) plus `letter.o`, `basic.o`:

    _NaaConnect  _NaaInt  _NaaEndSession  _NaaSetdv  _NaaSibrr  _NaaSinfo
    _NaaMakeLetter  _NaaSendLetter  _NaaChangeHost  _NaaEqual  _NaaGetInt2
    _NaaTermNo  _NaaTextSize  _NaaSout  _ReConnect  _ExChangeID  _Connected

Their own diagnostic strings settle what they do:

    NaaConnect:Sibas '%s' unknown in /etc/hosts!
    NaaConnect:Sibas '%s' undefined in /etc/services!
    NaaConnect.socket()
    NaaConnect():connect
    NaaInt:write()
    NaaInt:read()
    NaaInt():Connection terminated: parameters:

`NaaConnect` resolves a host name and a service name and opens a TCP socket. Whatever "NAA"
stood for at ND, in this code it names the client-side session layer over sockets, not a
COSMOS transport. Inferred, not proved: the name is inherited from ND's earlier
network-access vocabulary; nothing in the material expands the abbreviation.

There is one string, `xrouth`, that looks like a COSMOS "XROUTE" header but is not — see §5.

## 4. What the transport really is

`sibrlib*.a` (the remote library, the one `tst/Makefile` links against) references these
external symbols out of `NaaInt.o`, `setdv.o`, `gethostent.o`, `gethostid.o`, `getsocket.o`:

    _socket  _connect  _write  _read  _close  _htons  _errno
    _fopen _fgets _fclose _atoi _strcpy _strcat _strncmp _strlen _getenv

Host and service resolution is done by the library itself rather than by libc: `gethostent.o`
and `gethostid.o` open `/etc` + `/hosts` and scan it, `getsocket.o` opens `/etc` + `/services`;
all three honour an environment variable `SIBCOMM` that overrides the directory, and all three
fall back to the literal `localhost`. Failure texts:

    gethost():Unable to find '%s' (/etc/hosts)
    GetSocketId: Unable to find '%s'(/etc/services)

The service name is built by `sprintf` from the pattern `*SIB%d` (`setdv.o`), i.e. SIBAS
system number *n* is the `/etc/services` entry `*SIB<n>`; `letter.o` additionally carries
`*SIBAS-SSTA`, the service used by the status call `SSTA` that `tst/dbnam.c` drives.
`setdv.o` also holds

    Give terminal number assigned to you on TELNET host PAD:

so a session can be tied to a terminal number when the user reaches the host through a
TELNET PAD. This is a TCP/IP world throughout.

`sibxlib.a` is a different animal: it is the **local** access library. Its `vektor` union
enumerates five transport kinds — `shm`, `sock`, `tli`, `sna`, `x25` — with per-transport
control blocks `shmcomt {char shmname[30]}`, `sockcomt {char sysname[32]; long wksock}`,
`tlicomt {tliid}`, `snacomt {dummy}`, `x25comt {dummy}`. Only the shared-memory path is
actually implemented in the modules present: `clipc.o` / `cluipc.o` are System V IPC
(`ipcm_create/ipcm_enter/ipcm_leave`, `kill`, `getpid`, `getuid`, `geteuid`, name templates
`*uid-`, `*mother`, `*sock-`, `*tli-`), and `sibslib.o` talks to a local server process named
`sibxrcd` (`No sibxrcd server started`, `Disconnected from sibxrcd`, working directory
`/tmp/sibas`). The `sna` and `x25` control blocks are placeholders — one `dummy` member each.

**Not SunOS, despite `-DSUN` in the Makefile.** All six `.a` files are XENIX-style archives
(2-byte magic `0177545`, 26-byte binary member headers: `name[14]`, `date[4]`, `uid`, `gid`,
`mode[2]`, `size[4]`) — that is why GNU `ar t` lists nothing, the `!<arch>` magic is simply
not part of this format. The members are Intel OMF objects with Microsoft C comment records
(`MS C`, `SLIBFP`, `SLIBCd`, `DGROUP`, `$$TYPES`/`$$SYMBOLS` CodeView). `sibver.o` states the
build host outright:

    SIBAS DML library of Tue Sep 18 19:42:15 sommertid 1990.
    Hostid, solan(serial#:2012),OS XENIX 2.2.2.
    Compilation flags:CFLAGS='', COMM='-UFNS -DExceLan'.

## 5. The wire protocol

`sibxlib.a` was compiled with CodeView debug information, so the actual C structure layouts
survive in the object files even though no library source is on the floppies. Decoded from
the `$$TYPES` records of `rdbdef.o`, `skernel.o`, `scost.o`, `reldv.o`, `sibslib.o`
(record sizes are stored in bits, member offsets in bytes; 16-bit `int`, 32-bit `long`):

    struct sibhead   6 bytes    serno  @0 (int)   procno @2 (int)   packlen @4 (int)
    struct sibrec    2054 bytes head   @0 (sibhead)                 sibpack @6 (2048 bytes)

    struct comshead  6 bytes    v @0 (char)  l @1 (char)  type @2 (int)   length @4 (int)
    struct comrhead  8 bytes    v @0 (char)  l @1 (char)  status @2 (int) type @4 (int) length @6 (int)

    struct rqmsg     2506 bytes chead @0 (comshead)  msg @6  (2500 bytes)
    struct rspmsg    2508 bytes chead @0 (comrhead)  msg @8  (2500 bytes)

    struct sibhead1  6 bytes    serno @0   proc @2   length @4
    struct sinrq     26 bytes   funcno @0  length @2  device @4  xrout @6 (struct xrouth)
    struct sinrsp    48 bytes   funcno @0  length @2  head1 @4  head2 @6  head3 @8
                                contyp @10  peer @12 (36 bytes)

    struct xrouth    19 bytes   udef @0 (char)  xlet @1 (char)
                                rlenh @2 (char) rlenl @3 (char)
                                typ1 @4 (char)  tlen1 @5 (char)  par1 @6  (5 bytes)
                                typ2 @11 (char) tlen2 @12 (char) par2 @13 (5 bytes)

    struct dbinfo    72 bytes   dbproc @0   dbnam @4 (32 bytes)  dbstat @36
                                dbcomerr @40  dbcomid @44  dbcomtyp @48  dbcomp @52
                                dbcputyp @56  dbnohead @60  dbnoelem @64  dbsbrid @68

    struct commrec  164 bytes   cpid @0  cuid @4  ccom @8  cdbno @12  cret @16  dbinfo @20

So a request is a 6-byte header plus a payload capped at 2048 bytes (`sibrec`) or 2500 bytes
(`rqmsg`); the reply header carries an extra 2-byte `status` ahead of `type`/`length`.
`rlenh`/`rlenl` in `xrouth` are an explicit high-byte/low-byte split of a return length —
byte order carried by hand rather than left to the machine, which is what a library that
serves ND-500, Intel 386 and 88K servers from one client has to do.

Marshalling is done by an explicit pack/unpack layer, the same in both libraries:

    _szpack  _szputr _szputra  _szputp2 _szputp2a  _szputp4 _szputp4a
             _szgetr _szgetra  _szgetp2 _szgetp2a  _szgetp4

with two file-scope globals, `_spos` (current position in the pack buffer) and `_xrutno`
(the routine number of the DML call being packed). Every DML module in both libraries
references both. `xrutno` reads as Norwegian *rutine-nummer*, "routine number" — that is,
`xrout`/`xrouth` in the wire structures is the **SIBAS routine** header, an RPC descriptor
(routine number, return length, then `typ`/`tlen`/`par` triples for the arguments), and not
a COSMOS network route. Inferred from the field layout and the surrounding names; no comment
in the material says so outright.

`NaaInt` in the socket library prints the same shape of header when a connection dies:

       V=%d/L=%d,SubC:%d,Length:%d,Func=%d,STUB.len=%d

`V`/`L` line up with `comshead.v`/`comshead.l` and `Length`/`Func` with `length`/`type`.
Inferred — `sibrlib*.a` was compiled without debug type records, so its structure layouts
cannot be read out the way `sibxlib.a`'s can. The numeric routine numbers and function codes
live in the compiled code as immediates and were **not** extracted; they remain unknown.

## 6. The DML routine set

`inc/sibrlib.h` ("Predefinition of all SIBAS routines", version 1.0.2, Knut Haakon Flottorp,
Norsk Data a/s, building B4N, last SCCS update 1990-07-04) declares 92 routines (`sibxlib.h` and `sibxlib.imp` declare 91 each, in lower case). It carries
**no per-routine comments** — the file's own "Content: See routine headers below" points at
headers that are not in the file, so the meaning of individual names cannot be read off the
material and must not be invented. What the material does establish:

- The names are the standard SIBAS DML set: `SETDV`/`RELDV` (select / release a SIBAS device,
  i.e. a database server number — `tst/wide.c:96,113` uses them as open/close bracket),
  `SOPDB`/`SCLDB` (open / close database, with mode `15473` and an 8-character password in
  every test program), `SRRLM`/`SFRLM` (reserve / free realms, taking parallel `usage[]` and
  `prot[]` arrays), `SRFIR` (position on first record), `SGET`/`SGETN`/`SSGET`/`SRGET`
  (fetch), `SRNIS`/`SRPIS`/`SRNSM`/`SRFSM`/`SRLSM`/`SRPSM`/`SRSOW` (navigate index and set
  membership), `STORE`/`SMDFY`/`SRASE` (write), `SINSR`/`SREMO`/`SCONN`/`SDCON` (set
  membership), `SLOCK`/`SUNLK`/`SFORG` (locking), `SUBEG`/`SUEND`/`SROLL`/`SYNCP` (transaction
  begin/end/rollback/checkpoint), `STOWD`/`SGEWD` (store / get *wide* column, the long-record
  interface `tst/wide.c` exercises with a `short ctlblk[9]` control block and a `long`
  byte count), `SDBEC` (fetch the last exception: set name, two table names, item name,
  DML code, DBEC code), `SEMSG` (turn a DBEC/DML pair into an SSI/SEC code plus the failing
  routine name — `tst/tst2.c:31-38`), `SINFO`/`SWINF` (data-dictionary enquiry, driven by
  `tst/askdb.c` with option codes 1..11, 1y00, 4500, 4600, 4700), `SSTA` (server/database
  status — `tst/dbnam.c` uses option 2 to enumerate databases on a host and option 1 to
  describe one), and the operator-side calls `START`, `SRUN`, `STOPS`, `SPAUS`, `SPASS`,
  `SRECO`, `SABOR`, `INLOG`, `ONLOG`/`OFLOG`, `STRLG`.
- The calling convention is uniform Fortran-style: every argument is a pointer, character
  arguments are fixed-width blank-padded upper-case fields (8 characters for names, 32 for a
  machine name), and the last argument is a status `int *`. All test programs blank-pad and
  upper-case by hand before every call; `tst/tstdv.c:48-59` (`mvnam`) is the canonical example.
- `sibxlib.h` adds eight client-side error codes that are *not* SIBAS DBEC codes but transport
  errors: `SIB_CORRUPT -401` (`/etc/sibclient` corrupt, from `setdv`), `SIB_ILLNO -402`,
  `SIB_NOCONN -403`, `SIB_NOSEND -404`, `SIB_DISC -405` (disconnected from server),
  `SIB_NORECV -406`, `SIB_NOCOMM -407`, `SIB_NODISC -408`. Six of the eight say "use scost",
  the cost/status call.
- `sibxlib.imp` is the PLANC binding for the same routine set: "SIBAS library Header file with
  PLANC interface … belonging to Norsk Data Service Team", 1.8 90/01/23. Each entry is
  `import (routine standard void,void (…) : name alias '_name')`, so PLANC calls the C
  library through the C symbol. It exposes three routines that `inc/sibrlib.h` does not
  declare: `srepr`, `sicon` and `scost` — and `scost`, the twelve-argument communication-cost
  and status call, is exactly the one the `SIB_*` error comments tell the caller to use.

## 7. FNS

Unknown. The material never expands the abbreviation.

What it does say:

- `tst/Makefile` line 14: `LIBRARY=/usr/fns/lib/libnet.a`, with `#LIBRARY=-lsocket`
  commented out on the next line as the alternative.
- `sibver.o` in each library records the flag pair used for that build:
  `COMM='-DFNS -UExceLan'` in the two `sibrlibB3Com.a` files, `COMM='-UFNS -DExceLan'`
  in `sibrlibBExc.a` and in sib2's `sibrlib.a`.
- The two builds differ in exactly one respect at the symbol level: the `-DFNS` build's
  `NaaInt.o` references `_nperror` and does not reference `_htons`; the `-DExceLan` build
  references `_experror` and `_htons` and carries the literal `tcp` (the protocol argument
  for the service lookup). Both call `_socket`, `_connect`, `_read`, `_write`, `_close`.

So `FNS` and `ExceLan` are two interchangeable TCP/IP stacks for the same XENIX host, selected
at compile time, differing only in their error-reporting entry point and in whether the
caller has to byte-swap the port number. The library file names `sibrlibB3Com.a` and
`sibrlibBExc.a` pair `-DFNS` with 3Com and `-DExceLan` with Excelan — vendor names, inferred
from the file names alone. What `FNS` stands for is not stated anywhere in the material and
is not guessed here.

## 8. Completeness

**The source on these floppies is partial.** What is present:

- The eight `tst/` test/demo programs and their Makefile — complete and compilable in
  principle.
- Two public headers (`inc/sibrlib.h`, `inc/sinfo.h`) and, on sib2, `sibxlib.h` and
  `sibxlib.imp`.

What is missing:

- **The library's own C source. None of it is here.** `sibrlib*.a` contains 103 object
  modules and `sibxlib.a` contains 99, every one compiled from a `.c` file named in the
  object (`NaaInt.c`, `skernel.c`, `letter.c`, `basic.c`, `setdv.c`, `reldv.c`,
  `gethostent.c`, `gethostid.c`, `getsocket.c`, `getitem.c`, `sibver.c`, `sccomlib.c`,
  `clipc.c`, `cluipc.c`, `sibslib.c`, `rdbdef.c`, `trace.c`, plus one `.c` per DML routine).
  Not one of those files is on either floppy. The libraries are built form only.
- `upcase.h`, included by `tst/tst2.c:2` and `tst/tstdv.c:3` — not on either floppy, so
  those two programs will not compile as they stand.
- Any private header defining `sibhead`, `sibrec`, `comshead`, `comrhead`, `rqmsg`, `rspmsg`,
  `sinrq`, `sinrsp`, `xrouth`, `dbinfo`, `commrec`. Those layouts are recoverable only from
  `sibxlib.a`'s CodeView debug records, as reconstructed in §5.
- sib1 has no plain `sibrlib.a` — only the two COMM variants.
- The server side (`sibxrcd`, and whatever answers `*SIB<n>` on the remote host) is not on
  the floppies in any form.

## 9. Things not verified

- The numeric SIBAS routine numbers (`xrutno`) and function codes (`funcno`, `comshead.type`)
  are compiled into the code as immediates and were not extracted. Unknown.
- The layout of `sibrlib*.a`'s own request structures. That library was built without debug
  type records; the structures listed in §5 come from `sibxlib.a`. Whether the socket library
  uses the identical `sibhead`/`sibrec` is inferred from the shared `_spos`/`_xrutno`/`_sz*`
  marshalling symbols, not proved.
- The meaning of `xrouth.udef` and `xrouth.xlet` — `xlet` also exists as the global `_xlet`
  in `sibslib.o` and is what `sxsndrcv` sends, so it is the unit of exchange, but nothing in
  the material names it.
- What `NAA` and `FNS` abbreviate.
- Whether the `tli`, `sna` and `x25` transports in `sibxlib.a`'s `vektor` union were ever
  implemented elsewhere; here they are declared and their control blocks are empty
  placeholders.
