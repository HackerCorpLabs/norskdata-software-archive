"use strict";
var NdfsLib = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // dist/index.js
  var index_exports = {};
  __export(index_exports, {
    ACCESS_DEFAULT: () => ACCESS_DEFAULT,
    AccessPermissions: () => AccessPermissions,
    BitFile: () => BitFile,
    BlockPointer: () => BlockPointer,
    BootFormat: () => BootFormat,
    ChecksumValidation: () => ChecksumValidation,
    ENTRIES_PER_PAGE: () => ENTRIES_PER_PAGE,
    ENTRY_SIZE: () => ENTRY_SIZE,
    EXTENDED_INFO_OFFSET: () => EXTENDED_INFO_OFFSET,
    EXTENDED_INFO_SIZE: () => EXTENDED_INFO_SIZE,
    FIRST_ALLOCATABLE_BLOCK: () => FIRST_ALLOCATABLE_BLOCK,
    FT_ALLOCATED: () => FT_ALLOCATED,
    FT_CONTIGUOUS: () => FT_CONTIGUOUS,
    FT_INDEXED: () => FT_INDEXED,
    FT_LIBRARY: () => FT_LIBRARY,
    FT_MAGTAPE: () => FT_MAGTAPE,
    FT_PERIPHERAL: () => FT_PERIPHERAL,
    FT_SPOOLING: () => FT_SPOOLING,
    FT_TERMINAL: () => FT_TERMINAL,
    FileAccessType: () => FileAccessType,
    FileOperationType: () => FileOperationType,
    FileTypeFlags: () => FileTypeFlags,
    ImageTemplate: () => ImageTemplate,
    MASTER_BLOCK_OFFSET: () => MASTER_BLOCK_OFFSET,
    MASTER_BLOCK_SIZE: () => MASTER_BLOCK_SIZE,
    MAX_FRIENDS: () => MAX_FRIENDS,
    MAX_OBJECT_FILE_POINTERS: () => MAX_OBJECT_FILE_POINTERS,
    MAX_USERS: () => MAX_USERS,
    MAX_USER_FILE_POINTERS: () => MAX_USER_FILE_POINTERS,
    MasterBlock: () => MasterBlock,
    NDFS_NAME_MAX: () => NDFS_NAME_MAX,
    NDFS_NAME_TERMINATOR: () => NDFS_NAME_TERMINATOR,
    NDFS_PAGE_SIZE: () => NDFS_PAGE_SIZE,
    NDFS_TYPE_MAX: () => NDFS_TYPE_MAX,
    NdfsFileSystem: () => NdfsFileSystem,
    OBJECT_ENTRY_IN_USE: () => OBJECT_ENTRY_IN_USE,
    ObjectEntry: () => ObjectEntry,
    ObjectFile: () => ObjectFile,
    PERM_APPEND: () => PERM_APPEND,
    PERM_DELETE: () => PERM_DELETE,
    PERM_EXECUTE: () => PERM_EXECUTE,
    PERM_READ: () => PERM_READ,
    PERM_WRITE: () => PERM_WRITE,
    PointerType: () => PointerType,
    USER_ENTRY_FLAG: () => USER_ENTRY_FLAG,
    UserEntry: () => UserEntry,
    UserFile: () => UserFile,
    UserFriend: () => UserFriend,
    XAT_EXTENSION: () => XAT_EXTENSION,
    XAT_KEYS: () => XAT_KEYS,
    checkAccess: () => checkAccess,
    createNdfsImage: () => createNdfsImage,
    dateToNdTime: () => dateToNdTime,
    deserializeXat: () => deserializeXat,
    detectBootFormat: () => detectBootFormat,
    getAccessLevel: () => getAccessLevel,
    getFriendPermissions: () => getFriendPermissions,
    getXatFileName: () => getXatFileName,
    isTextType: () => isTextType,
    isXatFile: () => isXatFile,
    loadBootCode: () => loadBootCode,
    ndTimeToDate: () => ndTimeToDate,
    objectEntryToXat: () => objectEntryToXat,
    readNdfsName: () => readNdfsName,
    readUint16BE: () => readUint16BE,
    readUint32BE: () => readUint32BE,
    serializeXat: () => serializeXat,
    setParity: () => setParity,
    stripParity: () => stripParity,
    wildmatch: () => wildmatch,
    writeNdfsName: () => writeNdfsName,
    writeUint16BE: () => writeUint16BE,
    writeUint32BE: () => writeUint32BE,
    xatToObjectEntry: () => xatToObjectEntry
  });

  // dist/constants.js
  var NDFS_PAGE_SIZE = 2048;
  var NDFS_NAME_TERMINATOR = 39;
  var NDFS_NAME_MAX = 16;
  var NDFS_TYPE_MAX = 4;
  var ENTRIES_PER_PAGE = 32;
  var ENTRY_SIZE = 64;
  var MAX_USER_FILE_POINTERS = 8;
  var MAX_OBJECT_FILE_POINTERS = 512;
  var MAX_USERS = 256;
  var MAX_FRIENDS = 8;
  var MASTER_BLOCK_OFFSET = 2016;
  var EXTENDED_INFO_OFFSET = 2e3;
  var MASTER_BLOCK_SIZE = 32;
  var EXTENDED_INFO_SIZE = 16;
  var FIRST_ALLOCATABLE_BLOCK = 7;
  var USER_ENTRY_FLAG = 129;
  var OBJECT_ENTRY_IN_USE = 128;

  // dist/types.js
  var PointerType;
  (function(PointerType2) {
    PointerType2[PointerType2["Contiguous"] = 0] = "Contiguous";
    PointerType2[PointerType2["Indexed"] = 1] = "Indexed";
    PointerType2[PointerType2["SubIndexed"] = 2] = "SubIndexed";
    PointerType2[PointerType2["Reserved"] = 3] = "Reserved";
  })(PointerType || (PointerType = {}));
  var BootFormat;
  (function(BootFormat2) {
    BootFormat2["None"] = "none";
    BootFormat2["Binary"] = "binary";
    BootFormat2["BPUN"] = "bpun";
    BootFormat2["FloMon"] = "flomon";
  })(BootFormat || (BootFormat = {}));
  var FileAccessType;
  (function(FileAccessType2) {
    FileAccessType2[FileAccessType2["Own"] = 0] = "Own";
    FileAccessType2[FileAccessType2["Friend"] = 1] = "Friend";
    FileAccessType2[FileAccessType2["Public"] = 2] = "Public";
  })(FileAccessType || (FileAccessType = {}));
  var FileOperationType;
  (function(FileOperationType2) {
    FileOperationType2[FileOperationType2["Read"] = 0] = "Read";
    FileOperationType2[FileOperationType2["Write"] = 1] = "Write";
    FileOperationType2[FileOperationType2["Append"] = 2] = "Append";
    FileOperationType2[FileOperationType2["Execute"] = 3] = "Execute";
    FileOperationType2[FileOperationType2["Delete"] = 4] = "Delete";
    FileOperationType2[FileOperationType2["List"] = 5] = "List";
  })(FileOperationType || (FileOperationType = {}));
  var ChecksumValidation;
  (function(ChecksumValidation2) {
    ChecksumValidation2["Valid"] = "valid";
    ChecksumValidation2["ValidLowByteOnly"] = "valid_low_byte";
    ChecksumValidation2["Invalid"] = "invalid";
  })(ChecksumValidation || (ChecksumValidation = {}));
  var ImageTemplate;
  (function(ImageTemplate2) {
    ImageTemplate2["Floppy360KB"] = "floppy_360kb";
    ImageTemplate2["Floppy12MB"] = "floppy_12mb";
    ImageTemplate2["Smd75MB"] = "smd_75mb";
    ImageTemplate2["Winchester74MB"] = "winchester_74mb";
    ImageTemplate2["Custom"] = "custom";
  })(ImageTemplate || (ImageTemplate = {}));
  var FileTypeFlags;
  (function(FileTypeFlags2) {
    FileTypeFlags2[FileTypeFlags2["None"] = 0] = "None";
    FileTypeFlags2[FileTypeFlags2["TerminalFile"] = 1] = "TerminalFile";
    FileTypeFlags2[FileTypeFlags2["PeripheralFile"] = 2] = "PeripheralFile";
    FileTypeFlags2[FileTypeFlags2["SpoolingFile"] = 4] = "SpoolingFile";
    FileTypeFlags2[FileTypeFlags2["IndexedFile"] = 8] = "IndexedFile";
    FileTypeFlags2[FileTypeFlags2["ContiguousFile"] = 16] = "ContiguousFile";
    FileTypeFlags2[FileTypeFlags2["AllocatedFile"] = 32] = "AllocatedFile";
    FileTypeFlags2[FileTypeFlags2["MagneticTapeFile"] = 64] = "MagneticTapeFile";
    FileTypeFlags2[FileTypeFlags2["LibraryFile"] = 128] = "LibraryFile";
  })(FileTypeFlags || (FileTypeFlags = {}));

  // dist/endian.js
  function readUint16BE(data, offset) {
    return data[offset] << 8 | data[offset + 1];
  }
  function readUint32BE(data, offset) {
    return (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
  }
  function writeUint16BE(data, offset, value) {
    data[offset] = value >>> 8 & 255;
    data[offset + 1] = value & 255;
  }
  function writeUint32BE(data, offset, value) {
    data[offset] = value >>> 24 & 255;
    data[offset + 1] = value >>> 16 & 255;
    data[offset + 2] = value >>> 8 & 255;
    data[offset + 3] = value & 255;
  }

  // dist/ndfs-name.js
  function readNdfsName(data, offset, maxLen) {
    let end = 0;
    for (let i = 0; i < maxLen; i++) {
      const b = data[offset + i];
      if (b === NDFS_NAME_TERMINATOR || b === 0)
        break;
      end++;
    }
    let result = "";
    for (let i = 0; i < end; i++) {
      result += String.fromCharCode(data[offset + i]);
    }
    return result;
  }
  function writeNdfsName(data, offset, name, maxLen) {
    const upper = name.toUpperCase();
    const len = Math.min(upper.length, maxLen);
    for (let i = 0; i < len; i++) {
      data[offset + i] = upper.charCodeAt(i) & 127;
    }
    if (len < maxLen) {
      data[offset + len] = NDFS_NAME_TERMINATOR;
      for (let i = len + 1; i < maxLen; i++) {
        data[offset + i] = 0;
      }
    }
  }

  // dist/nd-time.js
  var ND_EPOCH = 1950;
  function ndTimeToDate(value) {
    if (value === 0)
      return null;
    const year = (value >>> 26 & 63) + ND_EPOCH;
    const month = value >>> 22 & 15;
    const day = value >>> 17 & 31;
    const hour = value >>> 12 & 31;
    const minute = value >>> 6 & 63;
    const second = value & 63;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  function dateToNdTime(date) {
    if (date === null)
      return 0;
    const year = date.getFullYear() - ND_EPOCH;
    if (year < 0 || year > 63)
      return 0;
    return ((year & 63) << 26 | (date.getMonth() + 1 & 15) << 22 | (date.getDate() & 31) << 17 | (date.getHours() & 31) << 12 | (date.getMinutes() & 63) << 6 | date.getSeconds() & 63) >>> 0;
  }

  // dist/block-pointer.js
  var BlockPointer = class _BlockPointer {
    constructor(blockId = 0, type = PointerType.Contiguous) {
      this.blockId = blockId & 1073741823;
      this.type = type;
    }
    /** Create from a 32-bit native value. */
    static fromNative(value) {
      const type = value >>> 30;
      const blockId = value & 1073741823;
      return new _BlockPointer(blockId, type);
    }
    /** Create from big-endian bytes at offset. */
    static fromBytes(data, offset) {
      return _BlockPointer.fromNative(readUint32BE(data, offset));
    }
    /** Get the 32-bit native representation. */
    get native() {
      return ((this.type & 3) << 30 | this.blockId & 1073741823) >>> 0;
    }
    /** Check if this pointer is valid (non-zero blockId, non-reserved type). */
    isValid() {
      return this.blockId > 0 && this.type !== PointerType.Reserved;
    }
    /** Serialize to big-endian bytes at offset. */
    toBytes(data, offset) {
      writeUint32BE(data, offset, this.native);
    }
    /** Serialize to a new 4-byte array. */
    toBytesArray() {
      const buf = new Uint8Array(4);
      this.toBytes(buf, 0);
      return buf;
    }
    toString() {
      return `${this.blockId} (${PointerType[this.type]})`;
    }
  };

  // dist/master-block.js
  var MasterBlock = class _MasterBlock {
    constructor() {
      this.directoryName = "";
      this.objectFilePointer = null;
      this.userFilePointer = null;
      this.bitFilePointer = null;
      this.unreservedPages = 0;
      this.imageSize = 0;
      this.extChecksum = 0;
      this.extReserved1 = 0;
      this.extReserved2 = 0;
      this.extReserved3 = 0;
      this.extFlagWord = 0;
      this.extLastSystemNumber = 0;
      this.extPagesAvailable = 0;
      this.extCalculatedChecksum = 0;
      this.extValid = false;
      this.checksumState = ChecksumValidation.Invalid;
      this.hasFlomon = false;
    }
    /**
     * Parse a master block (and extended info) from a full page 0 buffer.
     * The buffer must be at least NDFS_PAGE_SIZE bytes.
     */
    static fromBytes(pageData) {
      if (pageData.length < NDFS_PAGE_SIZE) {
        throw new Error("Page data too small for master block");
      }
      const mb = new _MasterBlock();
      const off = MASTER_BLOCK_OFFSET;
      mb.directoryName = readNdfsName(pageData, off, NDFS_NAME_MAX);
      mb.objectFilePointer = BlockPointer.fromBytes(pageData, off + 16);
      mb.userFilePointer = BlockPointer.fromBytes(pageData, off + 20);
      mb.bitFilePointer = BlockPointer.fromBytes(pageData, off + 24);
      mb.unreservedPages = readUint32BE(pageData, off + 28);
      const ext = EXTENDED_INFO_OFFSET;
      mb.extChecksum = readUint16BE(pageData, ext);
      mb.extReserved1 = readUint16BE(pageData, ext + 2);
      mb.extReserved2 = readUint16BE(pageData, ext + 4);
      mb.extReserved3 = readUint16BE(pageData, ext + 6);
      mb.extFlagWord = readUint16BE(pageData, ext + 8);
      mb.extLastSystemNumber = readUint16BE(pageData, ext + 10);
      mb.extPagesAvailable = readUint32BE(pageData, ext + 12);
      const pagesLo = mb.extPagesAvailable & 65535;
      const pagesHi = mb.extPagesAvailable >>> 16 & 65535;
      const calculated = (pagesLo ^ pagesHi ^ mb.extFlagWord ^ mb.extReserved1 ^ mb.extReserved2 ^ mb.extReserved3) + mb.extLastSystemNumber & 65535;
      mb.extCalculatedChecksum = calculated;
      if (mb.extChecksum === calculated) {
        mb.checksumState = ChecksumValidation.Valid;
      } else if ((mb.extChecksum & 255) === (calculated & 255) && (mb.extChecksum & 65280) === 0) {
        mb.checksumState = ChecksumValidation.ValidLowByteOnly;
      } else {
        mb.checksumState = ChecksumValidation.Invalid;
      }
      mb.hasFlomon = _MasterBlock.detectFlomon(pageData);
      if (mb.hasFlomon) {
        mb.extValid = false;
      } else {
        const checksumNonZero = mb.extChecksum !== 0;
        const checksumOk = mb.checksumState === ChecksumValidation.Valid || mb.checksumState === ChecksumValidation.ValidLowByteOnly;
        mb.extValid = checksumNonZero && checksumOk;
      }
      return mb;
    }
    /**
     * Detect FLOMON boot format by checking for the zero-address/count/checksum pattern.
     * FLOMON disks have a simplified boot loader where the BPUN binary section
     * has address=0, count=0, and checksum=0.
     */
    static detectFlomon(pageData) {
      let exclamationPos = -1;
      for (let i = 0; i < Math.min(pageData.length, 256); i++) {
        if (pageData[i] === 33) {
          exclamationPos = i;
          break;
        }
      }
      if (exclamationPos < 0)
        return false;
      const afterExcl = exclamationPos + 1;
      if (afterExcl + 4 > pageData.length)
        return false;
      const addr = readUint16BE(pageData, afterExcl);
      const count = readUint16BE(pageData, afterExcl + 2);
      return addr === 0 && count === 0;
    }
    /** Check if the master block is valid. */
    isValid() {
      if (this.directoryName.length > 0) {
        for (let i = 0; i < this.directoryName.length; i++) {
          const c = this.directoryName.charCodeAt(i);
          if (c < 32 || c > 126)
            return false;
        }
      }
      let hasValidPointer = false;
      if (this.objectFilePointer !== null && this.objectFilePointer.isValid())
        hasValidPointer = true;
      if (this.userFilePointer !== null && this.userFilePointer.isValid())
        hasValidPointer = true;
      if (this.bitFilePointer !== null && this.bitFilePointer.isValid())
        hasValidPointer = true;
      return hasValidPointer || this.directoryName.length > 0;
    }
    /** Write the master block to page data at the standard offset. */
    writeToBytes(pageData) {
      if (pageData.length < NDFS_PAGE_SIZE) {
        throw new Error("Page buffer too small for master block");
      }
      const off = MASTER_BLOCK_OFFSET;
      pageData.fill(0, off, off + 32);
      writeNdfsName(pageData, off, this.directoryName, NDFS_NAME_MAX);
      if (this.objectFilePointer)
        this.objectFilePointer.toBytes(pageData, off + 16);
      if (this.userFilePointer)
        this.userFilePointer.toBytes(pageData, off + 20);
      if (this.bitFilePointer)
        this.bitFilePointer.toBytes(pageData, off + 24);
      writeUint32BE(pageData, off + 28, this.unreservedPages);
    }
    /** Write extended info to page data. */
    writeExtendedInfo(pageData) {
      if (pageData.length < NDFS_PAGE_SIZE) {
        throw new Error("Page buffer too small for extended info");
      }
      const ext = EXTENDED_INFO_OFFSET;
      const pagesLo = this.extPagesAvailable & 65535;
      const pagesHi = this.extPagesAvailable >>> 16 & 65535;
      const checksum = (pagesLo ^ pagesHi ^ this.extFlagWord ^ this.extReserved1 ^ this.extReserved2 ^ this.extReserved3) + this.extLastSystemNumber & 65535;
      writeUint16BE(pageData, ext, checksum);
      writeUint16BE(pageData, ext + 2, this.extReserved1);
      writeUint16BE(pageData, ext + 4, this.extReserved2);
      writeUint16BE(pageData, ext + 6, this.extReserved3);
      writeUint16BE(pageData, ext + 8, this.extFlagWord);
      writeUint16BE(pageData, ext + 10, this.extLastSystemNumber);
      writeUint32BE(pageData, ext + 12, this.extPagesAvailable);
    }
  };

  // dist/bit-file.js
  var BitFile = class {
    constructor() {
      this.indexPointer = null;
      this.totalPages = 0;
      this.bitmap = null;
    }
    /** Initialize a new empty bitmap for the given total page count. */
    initialize(totalPages) {
      this.totalPages = totalPages;
      const bitmapBytes = Math.ceil(totalPages / 8);
      this.bitmap = new Uint8Array(bitmapBytes);
    }
    /** Load bitmap data from raw bytes. */
    loadBitmap(data) {
      this.bitmap = new Uint8Array(data.length);
      this.bitmap.set(data);
    }
    /** Check if a block is marked as used. */
    isBlockUsed(blockId) {
      if (this.bitmap === null || blockId >= this.totalPages)
        return false;
      const byteIndex = blockId >>> 3;
      const bitIndex = blockId & 7;
      return (this.bitmap[byteIndex] & 1 << bitIndex) !== 0;
    }
    /** Mark a block as used. */
    markBlockUsed(blockId) {
      if (this.bitmap === null || blockId >= this.totalPages) {
        throw new RangeError(`Block ID ${blockId} out of range`);
      }
      const byteIndex = blockId >>> 3;
      const bitIndex = blockId & 7;
      this.bitmap[byteIndex] |= 1 << bitIndex;
    }
    /** Mark a block as free. */
    markBlockFree(blockId) {
      if (this.bitmap === null || blockId >= this.totalPages) {
        throw new RangeError(`Block ID ${blockId} out of range`);
      }
      const byteIndex = blockId >>> 3;
      const bitIndex = blockId & 7;
      this.bitmap[byteIndex] &= ~(1 << bitIndex);
    }
    /** Count total used pages. */
    calcUsedPages() {
      if (this.bitmap === null)
        return 0;
      let count = 0;
      for (let i = 0; i < this.totalPages; i++) {
        if (this.isBlockUsed(i))
          count++;
      }
      return count;
    }
    /** Get number of free pages. */
    getFreePages() {
      return this.totalPages - this.calcUsedPages();
    }
    /**
     * Find the first free block, starting from block 7 (blocks 0-6 are system).
     * Returns the block ID or -1 if no free block exists.
     */
    findFirstFreeBlock() {
      for (let i = FIRST_ALLOCATABLE_BLOCK; i < this.totalPages; i++) {
        if (!this.isBlockUsed(i))
          return i;
      }
      return -1;
    }
    /**
     * Find a contiguous range of free blocks.
     * Returns the starting block ID or -1 if no range found.
     */
    findFreeBlockRange(blocksNeeded) {
      if (blocksNeeded === 0 || blocksNeeded > this.totalPages)
        return -1;
      let consecutiveFree = 0;
      let rangeStart = 0;
      for (let i = 0; i < this.totalPages; i++) {
        if (!this.isBlockUsed(i)) {
          if (consecutiveFree === 0)
            rangeStart = i;
          consecutiveFree++;
          if (consecutiveFree >= blocksNeeded)
            return rangeStart;
        } else {
          consecutiveFree = 0;
        }
      }
      return -1;
    }
    /**
     * Allocate a range of blocks (mark as used).
     * Blocks 0-6 cannot be allocated. Returns false if any block is already used.
     */
    allocateBlocks(startBlock, count) {
      if (startBlock < FIRST_ALLOCATABLE_BLOCK)
        return false;
      if (startBlock + count > this.totalPages)
        return false;
      for (let i = startBlock; i < startBlock + count; i++) {
        if (this.isBlockUsed(i))
          return false;
      }
      for (let i = startBlock; i < startBlock + count; i++) {
        this.markBlockUsed(i);
      }
      return true;
    }
    /** Free a range of blocks. */
    freeBlocks(startBlock, count) {
      for (let i = startBlock; i < startBlock + count && i < this.totalPages; i++) {
        this.markBlockFree(i);
      }
    }
    /** Get a copy of the raw bitmap data. */
    getBitmapData() {
      if (this.bitmap === null)
        return new Uint8Array(0);
      const copy = new Uint8Array(this.bitmap.length);
      copy.set(this.bitmap);
      return copy;
    }
    /**
     * Write bitmap data into page-aligned buffers for disk writing.
     * Returns an array of page buffers to write starting at the pointer's block ID.
     */
    toPageBuffers() {
      if (this.bitmap === null)
        return [];
      const pagesNeeded = Math.ceil(this.bitmap.length / NDFS_PAGE_SIZE);
      const pages = [];
      for (let i = 0; i < pagesNeeded; i++) {
        const page = new Uint8Array(NDFS_PAGE_SIZE);
        const srcOffset = i * NDFS_PAGE_SIZE;
        const bytesToCopy = Math.min(NDFS_PAGE_SIZE, this.bitmap.length - srcOffset);
        if (bytesToCopy > 0) {
          page.set(this.bitmap.subarray(srcOffset, srcOffset + bytesToCopy));
        }
        pages.push(page);
      }
      return pages;
    }
  };

  // dist/user-friend.js
  var UserFriend = class _UserFriend {
    constructor(bits = 0) {
      this.bits = bits & 65535;
    }
    /** Create with explicit permissions. */
    static create(friendUserId, read = false, write = false, append = false, common = false, directory = false) {
      let bits = friendUserId & 255 | 1 << 15;
      if (read)
        bits |= 1 << 8;
      if (write)
        bits |= 1 << 9;
      if (append)
        bits |= 1 << 10;
      if (common)
        bits |= 1 << 11;
      if (directory)
        bits |= 1 << 12;
      return new _UserFriend(bits);
    }
    /** Parse from big-endian bytes. */
    static fromBytes(data, offset) {
      return new _UserFriend(readUint16BE(data, offset));
    }
    get entryUsed() {
      return (this.bits & 1 << 15) !== 0;
    }
    get directoryAccess() {
      return (this.bits & 1 << 12) !== 0;
    }
    get commonAccess() {
      return (this.bits & 1 << 11) !== 0;
    }
    get appendAccess() {
      return (this.bits & 1 << 10) !== 0;
    }
    get writeAccess() {
      return (this.bits & 1 << 9) !== 0;
    }
    get readAccess() {
      return (this.bits & 1 << 8) !== 0;
    }
    get friendUserIndex() {
      return this.bits & 255;
    }
    /** Set friend with permission bits. */
    setFriend(friendUserId, permissions) {
      this.bits = friendUserId & 255 | 1 << 15 | (permissions & 31) << 8;
    }
    /**
     * Parse a permission letters string into the 5-bit value used by setFriend:
     * R=read, W=write, A=append, C=common, D=directory. '-' and spaces are
     * ignored; null/empty yields 0. Throws on an unrecognised letter.
     */
    static parsePermissions(s) {
      if (!s)
        return 0;
      let bits = 0;
      const table = { R: 1, W: 2, A: 4, C: 8, D: 16 };
      for (const ch of s) {
        if (ch === "-" || ch === " ")
          continue;
        const up = ch.toUpperCase();
        if (!(up in table))
          throw new Error(`Invalid permission letter: '${ch}'`);
        bits |= table[up];
      }
      return bits;
    }
    /** Clear this friend slot. */
    clear() {
      this.bits = 0;
    }
    /** Write to big-endian bytes. */
    toBytes(data, offset) {
      writeUint16BE(data, offset, this.bits);
    }
    getPermissionString() {
      if (!this.entryUsed)
        return "-----";
      return (this.readAccess ? "R" : "-") + (this.writeAccess ? "W" : "-") + (this.appendAccess ? "A" : "-") + (this.commonAccess ? "C" : "-") + (this.directoryAccess ? "D" : "-");
    }
    toString() {
      if (!this.entryUsed)
        return "[Empty]";
      return `Friend[${this.friendUserIndex}] ${this.getPermissionString()}`;
    }
  };

  // dist/user-entry.js
  var UserEntry = class _UserEntry {
    constructor() {
      this.userIndex = 0;
      this.userName = "";
      this.password = 0;
      this.enterCount = 0;
      this.dateCreated = 0;
      this.lastDateEntered = 0;
      this.pagesReserved = 0;
      this.pagesUsed = 0;
      this.directoryIndex = 0;
      this.defaultFileAccess = 1279;
      this.raw = null;
      this.friends = [];
      for (let i = 0; i < MAX_FRIENDS; i++) {
        this.friends.push(new UserFriend());
      }
    }
    /**
     * Parse a user entry from 64 bytes at offset.
     * Returns null if the entry is not a valid user (flag != 0x81).
     */
    static fromBytes(data, offset) {
      if (data.length < offset + ENTRY_SIZE) {
        throw new Error("Insufficient data for user entry");
      }
      if ((data[offset] & USER_ENTRY_FLAG) !== USER_ENTRY_FLAG)
        return null;
      const entry = new _UserEntry();
      entry.raw = data.slice(offset, offset + ENTRY_SIZE);
      entry.enterCount = data[offset + 1];
      entry.userName = readNdfsName(data, offset + 2, NDFS_NAME_MAX);
      entry.password = readUint16BE(data, offset + 18);
      entry.dateCreated = readUint32BE(data, offset + 20);
      entry.lastDateEntered = readUint32BE(data, offset + 24);
      entry.pagesReserved = readUint32BE(data, offset + 28);
      entry.pagesUsed = readUint32BE(data, offset + 32);
      entry.directoryIndex = data[offset + 36];
      entry.userIndex = data[offset + 37];
      entry.defaultFileAccess = readUint16BE(data, offset + 40);
      for (let i = 0; i < MAX_FRIENDS; i++) {
        entry.friends[i] = UserFriend.fromBytes(data, offset + 48 + i * 2);
      }
      return entry;
    }
    /** Serialize to a 64-byte Uint8Array. */
    toBytes() {
      const buf = new Uint8Array(ENTRY_SIZE);
      if (this.raw && this.raw.length === ENTRY_SIZE) {
        buf.set(this.raw, 0);
      }
      buf[0] = USER_ENTRY_FLAG;
      buf[1] = this.enterCount & 255;
      writeNdfsName(buf, 2, this.userName, NDFS_NAME_MAX);
      writeUint16BE(buf, 18, this.password);
      writeUint32BE(buf, 20, this.dateCreated);
      writeUint32BE(buf, 24, this.lastDateEntered);
      writeUint32BE(buf, 28, this.pagesReserved);
      writeUint32BE(buf, 32, this.pagesUsed);
      buf[36] = this.directoryIndex;
      buf[37] = this.userIndex & 255;
      writeUint16BE(buf, 40, this.defaultFileAccess);
      for (let i = 0; i < MAX_FRIENDS; i++) {
        this.friends[i].toBytes(buf, 48 + i * 2);
      }
      return buf;
    }
    /** Check if user has exceeded quota. */
    isOverQuota() {
      return this.pagesUsed > this.pagesReserved;
    }
    /** Get remaining free pages in quota. */
    getFreePages() {
      return this.pagesReserved - this.pagesUsed;
    }
    /** Set user name (max 16 chars, uppercased). */
    setName(name) {
      if (!name || name.trim().length === 0)
        throw new Error("User name cannot be empty");
      this.userName = name.toUpperCase().trim().substring(0, NDFS_NAME_MAX);
    }
    /** Check if userId is in this user's friend list. */
    isFriend(userId) {
      for (let i = 0; i < this.friends.length; i++) {
        if (this.friends[i].entryUsed && this.friends[i].friendUserIndex === userId)
          return true;
      }
      return false;
    }
    /** Add a friend. Returns false if no empty slot. */
    addFriend(friendId, permissions) {
      for (let i = 0; i < this.friends.length; i++) {
        if (!this.friends[i].entryUsed) {
          this.friends[i].setFriend(friendId, permissions);
          return true;
        }
      }
      return false;
    }
    /** Remove a friend. Returns false if not found. */
    removeFriend(friendId) {
      for (let i = 0; i < this.friends.length; i++) {
        if (this.friends[i].entryUsed && this.friends[i].friendUserIndex === friendId) {
          this.friends[i].clear();
          return true;
        }
      }
      return false;
    }
    /** Get friend entry for a user. */
    getFriend(friendId) {
      for (let i = 0; i < this.friends.length; i++) {
        if (this.friends[i].entryUsed && this.friends[i].friendUserIndex === friendId) {
          return this.friends[i];
        }
      }
      return null;
    }
  };

  // dist/user-file.js
  var UserFile = class {
    constructor() {
      this.indexPointer = null;
      this.entries = /* @__PURE__ */ new Map();
    }
    /** Get all user entries as an array. */
    getUsers() {
      const result = [];
      this.entries.forEach((v) => result.push(v));
      return result;
    }
    /** Get a user by index. */
    getUser(index) {
      return this.entries.get(index) ?? null;
    }
    /** Find a user by name (case-insensitive). */
    findUser(userName) {
      const upper = userName.toUpperCase();
      const iter = this.entries.values();
      let next = iter.next();
      while (!next.done) {
        if (next.value.userName.toUpperCase() === upper)
          return next.value;
        next = iter.next();
      }
      return null;
    }
    /** Add or update a user entry. */
    addUser(entry) {
      this.entries.set(entry.userIndex, entry);
    }
    /** Remove a user entry. */
    removeUser(index) {
      return this.entries.delete(index);
    }
    /** Update a user's quota. */
    updateUserQuota(userIndex, newReservedPages) {
      const user = this.entries.get(userIndex);
      if (!user)
        return false;
      user.pagesReserved = newReservedPages;
      return true;
    }
    /** Update a user's usage. */
    updateUserUsage(userIndex, pagesUsed) {
      const user = this.entries.get(userIndex);
      if (!user)
        return false;
      user.pagesUsed = pagesUsed;
      return true;
    }
    /** Get the next available user index. */
    getNextAvailableIndex() {
      for (let i = 0; i < MAX_USERS; i++) {
        if (!this.entries.has(i))
          return i;
      }
      return -1;
    }
    /** Get total pages reserved across all users. */
    getTotalPagesReserved() {
      let total = 0;
      this.entries.forEach((u) => {
        total += u.pagesReserved;
      });
      return total;
    }
    /** Get total pages used across all users. */
    getTotalPagesUsed() {
      let total = 0;
      this.entries.forEach((u) => {
        total += u.pagesUsed;
      });
      return total;
    }
    /** Clear all entries. */
    clear() {
      this.entries.clear();
    }
    /**
     * Load user entries from index block and data pages.
     * indexPage: the 2048-byte index block (contains up to 8 block pointers).
     * readPage: callback to read a data page by block ID.
     */
    loadFromPages(indexPage, readPage) {
      this.entries.clear();
      for (let i = 0; i < MAX_USER_FILE_POINTERS; i++) {
        const ptr = BlockPointer.fromBytes(indexPage, i * 4);
        if (!ptr.isValid())
          continue;
        const dataPage = readPage(ptr.blockId);
        for (let j = 0; j < ENTRIES_PER_PAGE; j++) {
          const entryOffset = j * ENTRY_SIZE;
          const user = UserEntry.fromBytes(dataPage, entryOffset);
          if (user !== null) {
            this.entries.set(user.userIndex, user);
          }
        }
      }
    }
    /**
     * Serialize all user entries into page-aligned buffers.
     * Returns: { indexPage, dataPages: Map<pointerIndex, pageData> }
     */
    toPageBuffers() {
      const indexPage = new Uint8Array(NDFS_PAGE_SIZE);
      const dataPages = [];
      const pageMap = /* @__PURE__ */ new Map();
      this.entries.forEach((user) => {
        const pageIndex = Math.floor(user.userIndex / ENTRIES_PER_PAGE);
        if (!pageMap.has(pageIndex)) {
          pageMap.set(pageIndex, new Uint8Array(NDFS_PAGE_SIZE));
        }
        const page = pageMap.get(pageIndex);
        const slotInPage = user.userIndex % ENTRIES_PER_PAGE;
        const bytes = user.toBytes();
        page.set(bytes, slotInPage * ENTRY_SIZE);
      });
      for (let i = 0; i < MAX_USER_FILE_POINTERS; i++) {
        const page = pageMap.get(i);
        if (page) {
          dataPages.push(page);
        } else {
          dataPages.push(new Uint8Array(NDFS_PAGE_SIZE));
        }
      }
      return { indexPage, dataPages };
    }
    /**
     * Serialize the single user-file data page `pageIndex`, zero-filled.
     * Zero-fill clears the slot of any removed user.
     */
    toDataPage(pageIndex) {
      const page = new Uint8Array(NDFS_PAGE_SIZE);
      this.entries.forEach((user) => {
        if (Math.floor(user.userIndex / ENTRIES_PER_PAGE) === pageIndex) {
          const slotInPage = user.userIndex % ENTRIES_PER_PAGE;
          page.set(user.toBytes(), slotInPage * ENTRY_SIZE);
        }
      });
      return page;
    }
  };

  // dist/object-entry.js
  var FT_TERMINAL = 1 << 0;
  var FT_PERIPHERAL = 1 << 1;
  var FT_SPOOLING = 1 << 2;
  var FT_INDEXED = 1 << 3;
  var FT_CONTIGUOUS = 1 << 4;
  var FT_ALLOCATED = 1 << 5;
  var FT_MAGTAPE = 1 << 6;
  var FT_LIBRARY = 1 << 7;
  var ACCESS_DEFAULT = 1023;
  var ObjectEntry = class _ObjectEntry {
    constructor() {
      this.header = OBJECT_ENTRY_IN_USE;
      this.headerWord = OBJECT_ENTRY_IN_USE << 8;
      this.objectIndex = 0;
      this.objectName = "";
      this.type = "DATA";
      this.userName = "";
      this.userIndex = 0;
      this.fileType = 0;
      this.pagesInFile = 0;
      this.bytesInFile = 0;
      this.filePointer = null;
      this.accessBits = 0;
      this.nextVersion = 0;
      this.prevVersion = 0;
      this.fileTypeFlags = 0;
      this.deviceNumber = 0;
      this.diskObjectIndex = 0;
      this.currentOpenCount = 0;
      this.totalOpenCount = 0;
      this.dateCreated = 0;
      this.lastDateRead = 0;
      this.lastDateWritten = 0;
      this.raw = null;
    }
    /** Full name in "NAME:TYPE" format. */
    get fullName() {
      return this.type ? `${this.objectName}:${this.type}` : this.objectName;
    }
    /** File type as text string. */
    get fileTypeAsText() {
      switch (this.fileType) {
        case 0:
          return "DATA";
        case 1:
          return "PROG";
        case 2:
          return "SYMB";
        case 3:
          return "TEXT";
        default:
          return `TYPE${this.fileType}`;
      }
    }
    /**
     * Parse an object entry from 64 bytes at offset.
     * Returns null if the entry is not in use (bit 7 of byte 0 not set).
     */
    static fromBytes(data, offset) {
      if (data.length < offset + ENTRY_SIZE) {
        throw new Error("Insufficient data for object entry");
      }
      if ((data[offset] & OBJECT_ENTRY_IN_USE) === 0)
        return null;
      const entry = new _ObjectEntry();
      entry.raw = data.slice(offset, offset + ENTRY_SIZE);
      entry.header = data[offset];
      entry.headerWord = readUint16BE(data, offset + 0);
      entry.objectName = readNdfsName(data, offset + 2, NDFS_NAME_MAX);
      entry.type = readNdfsName(data, offset + 18, NDFS_TYPE_MAX);
      entry.nextVersion = readUint16BE(data, offset + 22);
      entry.prevVersion = readUint16BE(data, offset + 24);
      entry.accessBits = readUint16BE(data, offset + 26);
      entry.fileTypeFlags = readUint16BE(data, offset + 28);
      entry.deviceNumber = readUint16BE(data, offset + 30);
      entry.fileType = data[offset + 32];
      entry.userIndex = data[offset + 34];
      entry.diskObjectIndex = readUint16BE(data, offset + 34);
      entry.currentOpenCount = readUint16BE(data, offset + 36);
      entry.totalOpenCount = readUint16BE(data, offset + 38);
      entry.dateCreated = readUint32BE(data, offset + 40);
      entry.lastDateRead = readUint32BE(data, offset + 44);
      entry.lastDateWritten = readUint32BE(data, offset + 48);
      entry.pagesInFile = readUint32BE(data, offset + 52);
      entry.bytesInFile = readUint32BE(data, offset + 56) + 1;
      entry.filePointer = BlockPointer.fromBytes(data, offset + 60);
      return entry;
    }
    /** Serialize to a 64-byte region in a buffer. */
    toBytes(buffer, offset) {
      if (buffer.length < offset + ENTRY_SIZE) {
        throw new Error("Insufficient buffer for object entry");
      }
      if (this.raw && this.raw.length === ENTRY_SIZE) {
        buffer.set(this.raw, offset);
      } else {
        buffer.fill(0, offset, offset + ENTRY_SIZE);
      }
      if (!this.raw || this.raw.length !== ENTRY_SIZE) {
        buffer[offset] = OBJECT_ENTRY_IN_USE;
      }
      writeNdfsName(buffer, offset + 2, this.objectName, NDFS_NAME_MAX);
      writeNdfsName(buffer, offset + 18, this.type, NDFS_TYPE_MAX);
      writeUint16BE(buffer, offset + 22, this.nextVersion);
      writeUint16BE(buffer, offset + 24, this.prevVersion);
      writeUint16BE(buffer, offset + 26, this.accessBits);
      writeUint16BE(buffer, offset + 28, this.fileTypeFlags);
      writeUint16BE(buffer, offset + 30, this.deviceNumber);
      buffer[offset + 32] = this.fileType & 255;
      buffer[offset + 34] = this.userIndex & 255;
      buffer[offset + 35] = this.diskObjectIndex & 255;
      writeUint16BE(buffer, offset + 36, this.currentOpenCount);
      writeUint16BE(buffer, offset + 38, this.totalOpenCount);
      writeUint32BE(buffer, offset + 40, this.dateCreated);
      writeUint32BE(buffer, offset + 44, this.lastDateRead);
      writeUint32BE(buffer, offset + 48, this.lastDateWritten);
      writeUint32BE(buffer, offset + 52, this.pagesInFile);
      const bytesMinusOne = this.bytesInFile > 0 ? this.bytesInFile - 1 : 0;
      writeUint32BE(buffer, offset + 56, bytesMinusOne);
      if (this.filePointer) {
        this.filePointer.toBytes(buffer, offset + 60);
      }
    }
  };

  // dist/object-file.js
  var ObjectFile = class {
    constructor() {
      this.indexPointer = null;
      this.entries = /* @__PURE__ */ new Map();
      this.nextIndex = 0;
    }
    /** Get all object entries. */
    getObjects() {
      const result = [];
      this.entries.forEach((v) => result.push(v));
      return result;
    }
    /** Get an object entry by index. */
    getObject(index) {
      return this.entries.get(index) ?? null;
    }
    /** Find an object by name and user. */
    findObject(objectName, userName) {
      const nameUpper = objectName.toUpperCase();
      const userUpper = userName.toUpperCase();
      const iter = this.entries.values();
      let next = iter.next();
      while (!next.done) {
        const entry = next.value;
        if (entry.objectName.toUpperCase() === nameUpper && entry.userName.toUpperCase() === userUpper) {
          return entry;
        }
        next = iter.next();
      }
      return null;
    }
    /** Add or update an object entry. */
    addObject(entry) {
      this.entries.set(entry.objectIndex, entry);
      if (entry.objectIndex >= this.nextIndex) {
        this.nextIndex = entry.objectIndex + 1;
      }
    }
    /** Remove an object entry. */
    removeObject(index) {
      return this.entries.delete(index);
    }
    /** Get objects belonging to a user (by name or index). */
    getUserObjects(userNameOrIndex) {
      const result = [];
      this.entries.forEach((entry) => {
        if (typeof userNameOrIndex === "string") {
          if (entry.userName.toUpperCase() === userNameOrIndex.toUpperCase()) {
            result.push(entry);
          }
        } else {
          if (entry.userIndex === userNameOrIndex)
            result.push(entry);
        }
      });
      return result;
    }
    /** Get next available object index. */
    getNextAvailableIndex() {
      for (let i = 0; i < this.nextIndex + 1; i++) {
        if (!this.entries.has(i))
          return i;
      }
      return this.nextIndex;
    }
    /**
     * Find the next free object slot WITHIN a user's region. SINTRAN partitions
     * the object file so user U owns slots U*256..U*256+255 and the object-index
     * high byte is the owning user. Returns -1 if the user's table is full.
     */
    findFreeUserSlot(userIndex) {
      const base = (userIndex & 255) << 8;
      for (let slot = base; slot < base + 256; slot++) {
        if (!this.entries.has(slot))
          return slot;
      }
      return -1;
    }
    /** Get total pages used by all objects. */
    getTotalPagesUsed() {
      let total = 0;
      this.entries.forEach((e) => {
        total += e.pagesInFile;
      });
      return total;
    }
    /** Clear all entries. */
    clear() {
      this.entries.clear();
      this.nextIndex = 0;
    }
    /**
     * Load entries from an indexed or sub-indexed structure.
     * pointer: the object file's block pointer (from master block).
     * readPage: callback to read a page by block ID.
     */
    loadFromPages(pointer, readPage) {
      this.entries.clear();
      this.indexPointer = pointer;
      let globalObjectIndex = 0;
      if (pointer.type === PointerType.Indexed) {
        const indexPage = readPage(pointer.blockId);
        this.loadObjectsFromIndexBlock(indexPage, readPage, globalObjectIndex);
      } else if (pointer.type === PointerType.SubIndexed) {
        const subIndexPage = readPage(pointer.blockId);
        for (let i = 0; i < MAX_OBJECT_FILE_POINTERS; i++) {
          const indexPtr = BlockPointer.fromBytes(subIndexPage, i * 4);
          if (!indexPtr.isValid())
            continue;
          const indexPage = readPage(indexPtr.blockId);
          globalObjectIndex = this.loadObjectsFromIndexBlock(indexPage, readPage, globalObjectIndex);
        }
      }
    }
    loadObjectsFromIndexBlock(indexPage, readPage, startIndex) {
      let objectIndex = startIndex;
      for (let i = 0; i < MAX_OBJECT_FILE_POINTERS; i++) {
        const ptr = BlockPointer.fromBytes(indexPage, i * 4);
        if (!ptr.isValid()) {
          objectIndex += ENTRIES_PER_PAGE;
          continue;
        }
        const dataPage = readPage(ptr.blockId);
        for (let j = 0; j < ENTRIES_PER_PAGE; j++) {
          const entry = ObjectEntry.fromBytes(dataPage, j * ENTRY_SIZE);
          if (entry !== null) {
            entry.objectIndex = objectIndex + j;
            this.entries.set(entry.objectIndex, entry);
            if (entry.objectIndex >= this.nextIndex) {
              this.nextIndex = entry.objectIndex + 1;
            }
          }
        }
        objectIndex += ENTRIES_PER_PAGE;
      }
      return objectIndex;
    }
    /**
     * Serialize all object entries into page-aligned buffers.
     * Returns the data pages that contain entries.
     */
    toDataPages() {
      const pageMap = /* @__PURE__ */ new Map();
      this.entries.forEach((entry) => {
        const pageIndex = Math.floor(entry.objectIndex / ENTRIES_PER_PAGE);
        if (!pageMap.has(pageIndex)) {
          pageMap.set(pageIndex, new Uint8Array(NDFS_PAGE_SIZE));
        }
        const page = pageMap.get(pageIndex);
        const slotInPage = entry.objectIndex % ENTRIES_PER_PAGE;
        entry.toBytes(page, slotInPage * ENTRY_SIZE);
      });
      return pageMap;
    }
    /**
     * Serialize the single object-file data page `pageIndex`, zero-filled.
     * Zero-fill clears any slot freed by a deletion so a removed file does not
     * reappear when the image is reloaded.
     */
    toDataPage(pageIndex) {
      const page = new Uint8Array(NDFS_PAGE_SIZE);
      this.entries.forEach((entry) => {
        if (Math.floor(entry.objectIndex / ENTRIES_PER_PAGE) === pageIndex) {
          const slotInPage = entry.objectIndex % ENTRIES_PER_PAGE;
          entry.toBytes(page, slotInPage * ENTRY_SIZE);
        }
      });
      return page;
    }
  };

  // dist/access-permissions.js
  var PERM_READ = 0;
  var PERM_WRITE = 1;
  var PERM_APPEND = 2;
  var PERM_EXECUTE = 3;
  var PERM_DELETE = 4;
  var AccessPermissions = class _AccessPermissions {
    constructor(accessBits = 0) {
      this.bits = accessBits & 32767;
    }
    /** Create from separate tier values. */
    static fromTiers(ownPerms, friendPerms, publicPerms) {
      const bits = (publicPerms & 31) << 10 | (friendPerms & 31) << 5 | ownPerms & 31;
      return new _AccessPermissions(bits);
    }
    /** Default permissions: owner full, friends RW, public R. */
    static default() {
      return new _AccessPermissions(1279);
    }
    /** Owner-only full access. */
    static ownerOnly() {
      return _AccessPermissions.fromTiers(31, 0, 0);
    }
    /** Get raw bits. */
    get rawBits() {
      return this.bits;
    }
    /** Get permission bits for a specific tier. */
    getTierBits(tier) {
      switch (tier) {
        case FileAccessType.Own:
          return this.bits & 31;
        case FileAccessType.Friend:
          return this.bits >>> 5 & 31;
        case FileAccessType.Public:
          return this.bits >>> 10 & 31;
      }
    }
    /** Check a specific permission for a tier. */
    hasPermission(tier, permBit) {
      return (this.getTierBits(tier) & 1 << permBit) !== 0;
    }
    canRead(tier) {
      return this.hasPermission(tier, PERM_READ);
    }
    canWrite(tier) {
      return this.hasPermission(tier, PERM_WRITE);
    }
    canAppend(tier) {
      return this.hasPermission(tier, PERM_APPEND);
    }
    canExecute(tier) {
      return this.hasPermission(tier, PERM_EXECUTE);
    }
    canDelete(tier) {
      return this.hasPermission(tier, PERM_DELETE);
    }
    /** Set a specific permission for a tier. */
    setPermission(tier, permBit, value) {
      const shift = tier === FileAccessType.Own ? 0 : tier === FileAccessType.Friend ? 5 : 10;
      const mask = 1 << shift + permBit;
      if (value) {
        this.bits |= mask;
      } else {
        this.bits &= ~mask;
      }
    }
    /** Get permission string for a tier (e.g., "DXAWR"). */
    getPermissionString(tier) {
      const t = this.getTierBits(tier);
      return ((t & 1 << PERM_DELETE) !== 0 ? "D" : "-") + ((t & 1 << PERM_EXECUTE) !== 0 ? "X" : "-") + ((t & 1 << PERM_APPEND) !== 0 ? "A" : "-") + ((t & 1 << PERM_WRITE) !== 0 ? "W" : "-") + ((t & 1 << PERM_READ) !== 0 ? "R" : "-");
    }
    toString() {
      return `Own:${this.getPermissionString(FileAccessType.Own)} Friend:${this.getPermissionString(FileAccessType.Friend)} Public:${this.getPermissionString(FileAccessType.Public)}`;
    }
  };

  // dist/access-control.js
  function getAccessLevel(file, user, owner) {
    if (user.userIndex === owner.userIndex)
      return FileAccessType.Own;
    if (owner.isFriend(user.userIndex))
      return FileAccessType.Friend;
    return FileAccessType.Public;
  }
  function getFriendPermissions(user, owner) {
    return owner.getFriend(user.userIndex);
  }
  function operationToPermBit(operation) {
    switch (operation) {
      case FileOperationType.Read:
        return PERM_READ;
      case FileOperationType.Write:
        return PERM_WRITE;
      case FileOperationType.Append:
        return PERM_APPEND;
      case FileOperationType.Execute:
        return PERM_EXECUTE;
      case FileOperationType.Delete:
        return PERM_DELETE;
      case FileOperationType.List:
        return PERM_READ;
    }
  }
  function checkAccess(file, user, owner, operation) {
    const accessLevel = getAccessLevel(file, user, owner);
    if (accessLevel === FileAccessType.Own) {
      const perms2 = new AccessPermissions(file.accessBits);
      return perms2.hasPermission(FileAccessType.Own, operationToPermBit(operation));
    }
    if (accessLevel === FileAccessType.Friend) {
      const friendEntry = getFriendPermissions(user, owner);
      if (friendEntry && friendEntry.entryUsed) {
        switch (operation) {
          case FileOperationType.Read:
            return friendEntry.readAccess;
          case FileOperationType.Write:
          case FileOperationType.Delete:
            return friendEntry.writeAccess;
          case FileOperationType.Append:
            return friendEntry.appendAccess;
          case FileOperationType.Execute:
            return friendEntry.commonAccess;
          case FileOperationType.List:
            return friendEntry.directoryAccess;
        }
      }
      const perms2 = new AccessPermissions(file.accessBits);
      return perms2.hasPermission(FileAccessType.Friend, operationToPermBit(operation));
    }
    const perms = new AccessPermissions(file.accessBits);
    return perms.hasPermission(FileAccessType.Public, operationToPermBit(operation));
  }

  // dist/image-creator.js
  function getTemplateSpec(template, customPages) {
    switch (template) {
      case ImageTemplate.Floppy360KB:
        return {
          ndfsPages: 154,
          fileBlocks: 154,
          objectFileBlock: 149,
          userFileBlock: 151,
          bitFileBlock: 153,
          unreservedPages: 1,
          isFloppy: true,
          includeExtendedInfo: false
        };
      case ImageTemplate.Floppy12MB:
        return {
          ndfsPages: 616,
          fileBlocks: 616,
          objectFileBlock: 611,
          userFileBlock: 613,
          bitFileBlock: 615,
          unreservedPages: 1,
          isFloppy: true,
          includeExtendedInfo: false
        };
      case ImageTemplate.Smd75MB:
        return {
          ndfsPages: 36945,
          fileBlocks: 38400,
          objectFileBlock: 18684,
          userFileBlock: 18686,
          bitFileBlock: 18472,
          unreservedPages: 36945,
          isFloppy: false,
          includeExtendedInfo: true
        };
      case ImageTemplate.Winchester74MB:
        return {
          ndfsPages: 36396,
          fileBlocks: 36360,
          objectFileBlock: 32771,
          userFileBlock: 32769,
          bitFileBlock: 18198,
          unreservedPages: 36396,
          isFloppy: false,
          includeExtendedInfo: true
        };
      case ImageTemplate.Custom: {
        if (!customPages || customPages < 20) {
          throw new Error("Custom template requires at least 20 pages");
        }
        const pages = customPages;
        const isFloppy = pages <= 1e3;
        let objBlock;
        let usrBlock;
        let bitBlock;
        if (isFloppy) {
          objBlock = pages - 5;
          usrBlock = pages - 3;
          bitBlock = pages - 1;
        } else {
          bitBlock = Math.floor(pages / 2);
          objBlock = Math.floor(pages * 0.85);
          usrBlock = objBlock + 2;
        }
        return {
          ndfsPages: pages,
          fileBlocks: pages,
          objectFileBlock: objBlock,
          userFileBlock: usrBlock,
          bitFileBlock: bitBlock,
          unreservedPages: isFloppy ? 1 : pages,
          isFloppy,
          includeExtendedInfo: !isFloppy
        };
      }
      default:
        throw new Error(`Unknown template: ${template}`);
    }
  }
  function createNdfsImage(options) {
    const spec = getTemplateSpec(options.template, options.customPages);
    const dirName = (options.directoryName || "NDFS").toUpperCase().substring(0, NDFS_NAME_MAX);
    const includeExt = options.includeExtendedInfo !== void 0 ? options.includeExtendedInfo : spec.includeExtendedInfo;
    const imageSize = spec.fileBlocks * NDFS_PAGE_SIZE;
    const image = new Uint8Array(imageSize);
    const mbOff = MASTER_BLOCK_OFFSET;
    writeNdfsName(image, mbOff, dirName, NDFS_NAME_MAX);
    const objPtr = new BlockPointer(spec.objectFileBlock, PointerType.Indexed);
    objPtr.toBytes(image, mbOff + 16);
    const usrPtr = new BlockPointer(spec.userFileBlock, PointerType.Indexed);
    usrPtr.toBytes(image, mbOff + 20);
    const bitPtr = new BlockPointer(spec.bitFileBlock, PointerType.Contiguous);
    bitPtr.toBytes(image, mbOff + 24);
    writeUint32BE(image, mbOff + 28, spec.unreservedPages);
    if (includeExt) {
      const ext = EXTENDED_INFO_OFFSET;
      const sysNum = options.systemNumber || 0;
      const flagWord = options.flagWord || 0;
      const pagesAvailable = spec.ndfsPages;
      writeUint16BE(image, ext + 2, 0);
      writeUint16BE(image, ext + 4, 0);
      writeUint16BE(image, ext + 6, 0);
      writeUint16BE(image, ext + 8, flagWord);
      writeUint16BE(image, ext + 10, sysNum);
      writeUint32BE(image, ext + 12, pagesAvailable);
      const pagesLo = pagesAvailable & 65535;
      const pagesHi = pagesAvailable >>> 16 & 65535;
      const checksum = (pagesLo ^ pagesHi ^ flagWord ^ 0 ^ 0 ^ 0) + sysNum & 65535;
      writeUint16BE(image, ext, checksum);
    }
    const bitmapOff = spec.bitFileBlock * NDFS_PAGE_SIZE;
    const markUsed = (blockId) => {
      if (blockId >= spec.fileBlocks)
        return;
      const byteIdx = blockId >>> 3;
      const bitIdx = blockId & 7;
      image[bitmapOff + byteIdx] |= 1 << bitIdx;
    };
    markUsed(0);
    markUsed(spec.objectFileBlock);
    const objDataBlock = spec.objectFileBlock + 1;
    markUsed(objDataBlock);
    markUsed(spec.userFileBlock);
    const usrDataBlock = spec.userFileBlock + 1;
    markUsed(usrDataBlock);
    markUsed(spec.bitFileBlock);
    const objIdxOff = spec.objectFileBlock * NDFS_PAGE_SIZE;
    const objDataPtr = new BlockPointer(objDataBlock, PointerType.Contiguous);
    objDataPtr.toBytes(image, objIdxOff);
    const usrIdxOff = spec.userFileBlock * NDFS_PAGE_SIZE;
    const usrDataPtr = new BlockPointer(usrDataBlock, PointerType.Contiguous);
    usrDataPtr.toBytes(image, usrIdxOff);
    const usrDataOff = usrDataBlock * NDFS_PAGE_SIZE;
    image[usrDataOff + 0] = USER_ENTRY_FLAG;
    image[usrDataOff + 1] = 0;
    writeNdfsName(image, usrDataOff + 2, "SYSTEM", NDFS_NAME_MAX);
    writeUint16BE(image, usrDataOff + 18, 0);
    const defaultQuota = Math.min(spec.ndfsPages, 1e3);
    writeUint32BE(image, usrDataOff + 28, defaultQuota);
    writeUint32BE(image, usrDataOff + 32, 0);
    image[usrDataOff + 36] = 0;
    image[usrDataOff + 37] = 0;
    writeUint16BE(image, usrDataOff + 38, 1279);
    if (options.users) {
      for (let u = 0; u < options.users.length; u++) {
        const userOpt = options.users[u];
        const slotIndex = u + 1;
        if (slotIndex >= ENTRIES_PER_PAGE)
          break;
        const entryOff = usrDataOff + slotIndex * ENTRY_SIZE;
        image[entryOff] = USER_ENTRY_FLAG;
        writeNdfsName(image, entryOff + 2, userOpt.name.toUpperCase(), NDFS_NAME_MAX);
        writeUint16BE(image, entryOff + 18, 0);
        writeUint32BE(image, entryOff + 28, userOpt.reservedPages);
        writeUint32BE(image, entryOff + 32, 0);
        image[entryOff + 36] = 0;
        image[entryOff + 37] = slotIndex;
        writeUint16BE(image, entryOff + 38, 1279);
      }
    }
    return image;
  }

  // dist/boot-loader.js
  var BOOT_SCAN_LIMIT = Math.min(1024, MASTER_BLOCK_OFFSET);
  function detectBootFormat(page0) {
    if (page0.length < NDFS_PAGE_SIZE)
      return BootFormat.None;
    let exclamationPos = -1;
    for (let i = 0; i < BOOT_SCAN_LIMIT; i++) {
      if (page0[i] === 33) {
        exclamationPos = i;
        break;
      }
    }
    if (exclamationPos >= 0) {
      const afterExcl = exclamationPos + 1;
      if (afterExcl + 4 <= page0.length) {
        const address = readUint16BE(page0, afterExcl);
        const count = readUint16BE(page0, afterExcl + 2);
        if (address === 0 && count === 0) {
          return BootFormat.FloMon;
        }
        if (count > 0) {
          return BootFormat.BPUN;
        }
      }
    }
    let hasNonZero = false;
    let allSame = true;
    const firstByte = page0[0];
    for (let i = 0; i < BOOT_SCAN_LIMIT; i++) {
      if (page0[i] !== 0)
        hasNonZero = true;
      if (page0[i] !== firstByte)
        allSame = false;
      if (hasNonZero && !allSame)
        break;
    }
    if (hasNonZero && !allSame) {
      return BootFormat.Binary;
    }
    return BootFormat.None;
  }
  function loadBootCode(page0) {
    const format = detectBootFormat(page0);
    if (format === BootFormat.None)
      return null;
    if (format === BootFormat.Binary) {
      const data2 = new Uint8Array(BOOT_SCAN_LIMIT);
      data2.set(page0.subarray(0, BOOT_SCAN_LIMIT));
      return {
        format,
        startAddress: 0,
        bootAddress: 0,
        loadAddress: 0,
        wordCount: 0,
        data: data2,
        checksumValid: false
      };
    }
    let exclamationPos = -1;
    for (let i = 0; i < BOOT_SCAN_LIMIT; i++) {
      if (page0[i] === 33) {
        exclamationPos = i;
        break;
      }
    }
    if (exclamationPos < 0)
      return null;
    const afterExcl = exclamationPos + 1;
    const address = readUint16BE(page0, afterExcl);
    const count = readUint16BE(page0, afterExcl + 2);
    if (format === BootFormat.FloMon) {
      const data2 = new Uint8Array(exclamationPos);
      data2.set(page0.subarray(0, exclamationPos));
      return {
        format,
        startAddress: 0,
        bootAddress: 0,
        loadAddress: 0,
        wordCount: 0,
        data: data2,
        checksumValid: true
      };
    }
    const dataStart = afterExcl + 4;
    const dataByteCount = count * 2;
    const checksumOffset = dataStart + dataByteCount;
    if (checksumOffset + 2 > MASTER_BLOCK_OFFSET) {
      const available = Math.min(dataByteCount, MASTER_BLOCK_OFFSET - dataStart);
      const data2 = new Uint8Array(available);
      data2.set(page0.subarray(dataStart, dataStart + available));
      return {
        format,
        startAddress: address,
        bootAddress: address,
        loadAddress: address,
        wordCount: count,
        data: data2,
        checksumValid: false
      };
    }
    const data = new Uint8Array(dataByteCount);
    data.set(page0.subarray(dataStart, dataStart + dataByteCount));
    let checksum = address + count;
    for (let i = 0; i < count; i++) {
      checksum += readUint16BE(page0, dataStart + i * 2);
    }
    checksum = checksum & 65535;
    const storedChecksum = readUint16BE(page0, checksumOffset);
    const checksumValid = checksum === storedChecksum;
    let bootAddress = address;
    if (checksumOffset + 4 <= page0.length) {
      const action = readUint16BE(page0, checksumOffset + 2);
      if (action > 0)
        bootAddress = action;
    }
    return {
      format,
      startAddress: address,
      bootAddress,
      loadAddress: address,
      wordCount: count,
      data,
      checksumValid
    };
  }

  // dist/parity.js
  var TEXT_TYPES = /* @__PURE__ */ new Set([
    "MODE",
    "SYMB",
    "TEXT",
    "C",
    "BATC",
    "OUT",
    "LOG",
    "LIST",
    "FADM",
    "BASM",
    "FORT",
    "NPL",
    "COBO",
    "PASC",
    "PLAN",
    "BAS",
    "MAC",
    "EDIT"
  ]);
  function popcount7(b) {
    let v = b & 127;
    let count = 0;
    while (v) {
      count += v & 1;
      v >>>= 1;
    }
    return count;
  }
  function stripParity(data) {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] & 127;
    }
    return result;
  }
  function setParity(data) {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const lo7 = data[i] & 127;
      const ones = popcount7(lo7);
      result[i] = ones % 2 !== 0 ? lo7 | 128 : lo7;
    }
    return result;
  }
  function isTextType(fileType) {
    return TEXT_TYPES.has(fileType.toUpperCase());
  }

  // dist/wildmatch.js
  function charEq(a, b, ci) {
    if (a === b)
      return true;
    if (ci)
      return a.toLowerCase() === b.toLowerCase();
    return false;
  }
  function wildmatch(pattern, name, caseInsensitive = false) {
    let p = 0;
    let n = 0;
    let starP = -1;
    let starN = -1;
    while (n < name.length) {
      if (p < pattern.length && (pattern[p] === "?" || charEq(pattern[p], name[n], caseInsensitive))) {
        p++;
        n++;
      } else if (p < pattern.length && pattern[p] === "*") {
        starP = ++p;
        starN = n;
      } else if (starP >= 0) {
        p = starP;
        n = ++starN;
      } else {
        return false;
      }
    }
    while (p < pattern.length && pattern[p] === "*")
      p++;
    return p === pattern.length;
  }

  // dist/xat.js
  var XAT_KEYS = {
    OBJECT_NAME: "ndfs.object_name",
    TYPE: "ndfs.type",
    USER_NAME: "ndfs.user_name",
    USER_INDEX: "ndfs.user_index",
    ACCESS_BITS: "ndfs.access_bits",
    FILE_TYPE_FLAGS: "ndfs.file_type_flags",
    FILE_TYPE: "ndfs.file_type",
    DEVICE_NUMBER: "ndfs.device_number",
    NEXT_VERSION: "ndfs.next_version",
    PREV_VERSION: "ndfs.prev_version",
    PAGES_IN_FILE: "ndfs.pages_in_file",
    BYTES_IN_FILE: "ndfs.bytes_in_file",
    DATE_CREATED: "ndfs.date_created",
    LAST_READ_DATE: "ndfs.last_read_date",
    LAST_WRITE_DATE: "ndfs.last_write_date"
  };
  var XAT_EXTENSION = ".xat";
  function objectEntryToXat(entry) {
    const props = {};
    props[XAT_KEYS.OBJECT_NAME] = entry.objectName;
    props[XAT_KEYS.TYPE] = entry.type;
    props[XAT_KEYS.USER_NAME] = entry.userName;
    props[XAT_KEYS.USER_INDEX] = entry.userIndex;
    props[XAT_KEYS.ACCESS_BITS] = entry.accessBits;
    props[XAT_KEYS.FILE_TYPE_FLAGS] = entry.fileTypeFlags;
    props[XAT_KEYS.FILE_TYPE] = entry.fileType;
    props[XAT_KEYS.DEVICE_NUMBER] = entry.deviceNumber;
    props[XAT_KEYS.NEXT_VERSION] = entry.nextVersion;
    props[XAT_KEYS.PREV_VERSION] = entry.prevVersion;
    props[XAT_KEYS.PAGES_IN_FILE] = entry.pagesInFile;
    props[XAT_KEYS.BYTES_IN_FILE] = entry.bytesInFile;
    props[XAT_KEYS.DATE_CREATED] = entry.dateCreated;
    props[XAT_KEYS.LAST_READ_DATE] = entry.lastDateRead;
    props[XAT_KEYS.LAST_WRITE_DATE] = entry.lastDateWritten;
    return props;
  }
  function xatToObjectEntry(xat, entry) {
    if (XAT_KEYS.OBJECT_NAME in xat && typeof xat[XAT_KEYS.OBJECT_NAME] === "string") {
      entry.objectName = xat[XAT_KEYS.OBJECT_NAME];
    }
    if (XAT_KEYS.TYPE in xat && typeof xat[XAT_KEYS.TYPE] === "string") {
      entry.type = xat[XAT_KEYS.TYPE];
    }
    if (XAT_KEYS.USER_NAME in xat && typeof xat[XAT_KEYS.USER_NAME] === "string") {
      entry.userName = xat[XAT_KEYS.USER_NAME];
    }
    if (XAT_KEYS.USER_INDEX in xat && typeof xat[XAT_KEYS.USER_INDEX] === "number") {
      entry.userIndex = xat[XAT_KEYS.USER_INDEX];
    }
    if (XAT_KEYS.ACCESS_BITS in xat && typeof xat[XAT_KEYS.ACCESS_BITS] === "number") {
      entry.accessBits = xat[XAT_KEYS.ACCESS_BITS];
    }
    if (XAT_KEYS.FILE_TYPE in xat && typeof xat[XAT_KEYS.FILE_TYPE] === "number") {
      entry.fileType = xat[XAT_KEYS.FILE_TYPE];
    }
    if (XAT_KEYS.FILE_TYPE_FLAGS in xat && typeof xat[XAT_KEYS.FILE_TYPE_FLAGS] === "number") {
      entry.fileTypeFlags = xat[XAT_KEYS.FILE_TYPE_FLAGS];
    }
    if (XAT_KEYS.DEVICE_NUMBER in xat && typeof xat[XAT_KEYS.DEVICE_NUMBER] === "number") {
      entry.deviceNumber = xat[XAT_KEYS.DEVICE_NUMBER];
    }
    if (XAT_KEYS.PAGES_IN_FILE in xat && typeof xat[XAT_KEYS.PAGES_IN_FILE] === "number") {
      entry.pagesInFile = xat[XAT_KEYS.PAGES_IN_FILE];
    }
    if (XAT_KEYS.BYTES_IN_FILE in xat && typeof xat[XAT_KEYS.BYTES_IN_FILE] === "number") {
      entry.bytesInFile = xat[XAT_KEYS.BYTES_IN_FILE];
    }
    if (XAT_KEYS.DATE_CREATED in xat && typeof xat[XAT_KEYS.DATE_CREATED] === "number") {
      entry.dateCreated = xat[XAT_KEYS.DATE_CREATED];
    }
    if (XAT_KEYS.LAST_READ_DATE in xat && typeof xat[XAT_KEYS.LAST_READ_DATE] === "number") {
      entry.lastDateRead = xat[XAT_KEYS.LAST_READ_DATE];
    }
    if (XAT_KEYS.LAST_WRITE_DATE in xat && typeof xat[XAT_KEYS.LAST_WRITE_DATE] === "number") {
      entry.lastDateWritten = xat[XAT_KEYS.LAST_WRITE_DATE];
    }
  }
  function serializeXat(props) {
    return JSON.stringify(props, null, 2);
  }
  function deserializeXat(json) {
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Invalid XAT data: expected a JSON object");
    }
    return parsed;
  }
  function getXatFileName(dataFile) {
    return dataFile + XAT_EXTENSION;
  }
  function isXatFile(fileName) {
    return fileName.length > XAT_EXTENSION.length && fileName.toLowerCase().endsWith(XAT_EXTENSION);
  }

  // dist/ndfs-filesystem.js
  var NdfsFileSystem = class _NdfsFileSystem {
    /**
     * Open an NDFS disk image from a buffer.
     * @param data - The raw disk image bytes (must be a multiple of 2048).
     * @param readOnly - If true, write operations will throw.
     */
    constructor(data, readOnly = false) {
      this.bitFile = new BitFile();
      this.userFile = new UserFile();
      this.objectFile = new ObjectFile();
      if (data instanceof ArrayBuffer) {
        this.data = new Uint8Array(data);
      } else {
        this.data = new Uint8Array(data.length);
        this.data.set(data);
      }
      this.readOnly = readOnly;
      if (this.data.length < NDFS_PAGE_SIZE) {
        throw new Error("Image too small: must be at least one NDFS page (2048 bytes)");
      }
      if (this.data.length % NDFS_PAGE_SIZE !== 0) {
        throw new Error("Image size must be a multiple of NDFS page size (2048 bytes)");
      }
      const page0 = this.readPage(0);
      this.masterBlock = MasterBlock.fromBytes(page0);
      if (!this.masterBlock.isValid()) {
        throw new Error("Invalid NDFS master block");
      }
      this.masterBlock.imageSize = this.data.length / NDFS_PAGE_SIZE;
      this.loadStructures();
    }
    /**
     * Create a new NDFS disk image from options.
     * Returns a fully initialized NdfsFileSystem ready for use.
     */
    static createImage(options) {
      const imageData = createNdfsImage(options);
      return new _NdfsFileSystem(imageData, false);
    }
    // ── Lifecycle ──────────────────────────────────────────────────────
    /** Export the current image as a new Uint8Array. */
    toBuffer() {
      const copy = new Uint8Array(this.data.length);
      copy.set(this.data);
      return copy;
    }
    // ── Read operations ────────────────────────────────────────────────
    /** Get the parsed master block. */
    getMasterBlock() {
      return this.masterBlock;
    }
    /** Get the volume/directory name. */
    getDirectoryName() {
      return this.masterBlock.directoryName;
    }
    /**
     * List directory contents.
     * - path="" or "/": lists users as directories.
     * - path="USERNAME": lists that user's files.
     */
    listDirectory(path = "") {
      const normalized = path.replace(/^\/+|\/+$/g, "");
      const entries = [];
      if (normalized === "") {
        const users = this.userFile.getUsers();
        for (let i = 0; i < users.length; i++) {
          const u = users[i];
          entries.push({
            name: u.userName,
            type: "",
            fullName: u.userName,
            userName: u.userName,
            size: 0,
            pages: 0,
            isDirectory: true,
            lastModified: null
          });
        }
      } else {
        const parts = normalized.split("/");
        if (parts.length > 1) {
          throw new Error("NDFS does not support subdirectories");
        }
        const userName = parts[0];
        const objects = this.objectFile.getUserObjects(userName);
        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i];
          const fullName = obj.type ? `${obj.objectName}:${obj.type}` : obj.objectName;
          entries.push({
            name: obj.objectName,
            type: obj.type,
            fullName,
            userName: obj.userName,
            size: obj.bytesInFile,
            pages: obj.pagesInFile,
            isDirectory: false,
            lastModified: null
          });
        }
      }
      return entries;
    }
    /**
     * Read a file's contents.
     * @param path - "USERNAME/FILENAME:TYPE" or "FILENAME:TYPE"
     * @param parity - Parity handling: 'none' (default, raw bytes),
     *   'strip' (clear bit 7, for reading ND text as ASCII).
     */
    readFile(path, parity = "none") {
      const obj = this.findObject(path);
      if (!obj)
        throw new Error(`File not found: ${path}`);
      const data = this.readObjectData(obj);
      if (parity === "strip")
        return stripParity(data);
      return data;
    }
    /** Get file metadata, or null if not found. */
    getMetadata(path) {
      const obj = this.findObject(path);
      if (!obj)
        return null;
      const fullName = obj.type ? `${obj.objectName}:${obj.type}` : obj.objectName;
      return {
        name: obj.objectName,
        type: obj.type,
        fullName,
        userName: obj.userName,
        size: obj.bytesInFile,
        pages: obj.pagesInFile,
        isDirectory: false,
        lastModified: null
      };
    }
    /** Check if a file exists. */
    fileExists(path) {
      return this.findObject(path) !== null;
    }
    // ── Write operations ───────────────────────────────────────────────
    /**
     * Write (create or overwrite) a file.
     * @param path - "USERNAME/FILENAME:TYPE" or "FILENAME:TYPE"
     * @param fileData - The raw bytes to write.
     * @param parity - Parity handling: 'none' (default, write raw bytes),
     *   'set' (apply ND-100 even parity before writing, for text files).
     */
    writeFile(path, fileData, parity = "none") {
      this.ensureWritable();
      if (parity === "set") {
        fileData = setParity(fileData);
      }
      const { userName, objectName, fileType } = this.parsePath(path);
      if (!objectName)
        throw new Error("Invalid path: filename required");
      const user = this.resolveUser(userName);
      if (!user)
        throw new Error(`User not found: ${userName || "(default)"}`);
      let dataPages = Math.ceil(fileData.length / NDFS_PAGE_SIZE);
      if (dataPages === 0)
        dataPages = 1;
      const indexBlocks = dataPages > MAX_OBJECT_FILE_POINTERS ? 1 + Math.ceil(dataPages / MAX_OBJECT_FILE_POINTERS) : 1;
      const totalRequired = dataPages + indexBlocks;
      const existing = this.objectFile.findObject(objectName, user.userName);
      let additionalNeeded = totalRequired;
      if (existing) {
        const existingIndexBlocks = existing.filePointer && existing.filePointer.type === PointerType.SubIndexed ? 1 + Math.ceil(existing.pagesInFile / MAX_OBJECT_FILE_POINTERS) : 1;
        const existingTotal = existing.pagesInFile + existingIndexBlocks;
        additionalNeeded = totalRequired > existingTotal ? totalRequired - existingTotal : 0;
      }
      if (additionalNeeded > 0) {
        const availableToUser = user.pagesReserved - user.pagesUsed;
        if (availableToUser < additionalNeeded) {
          const expansion = additionalNeeded - availableToUser;
          const freeOnDisk = this.bitFile.getFreePages();
          if (freeOnDisk < expansion) {
            throw new Error(`Insufficient disk space: need ${expansion} pages, only ${freeOnDisk} available`);
          }
          user.pagesReserved += expansion;
        }
      }
      if (existing) {
        this.updateExistingFile(existing, user, fileData);
      } else {
        this.createNewFile(objectName, fileType, user, fileData);
      }
    }
    /** Delete a file. */
    deleteFile(path) {
      this.ensureWritable();
      const obj = this.findObject(path);
      if (!obj)
        throw new Error(`File not found: ${path}`);
      if (obj.filePointer && obj.filePointer.blockId > 0) {
        this.freeFileBlocks(obj);
      }
      const user = this.userFile.getUser(obj.userIndex);
      if (user) {
        let indexBlocks = 0;
        if (obj.filePointer) {
          if (obj.filePointer.type === PointerType.Indexed) {
            indexBlocks = 1;
          } else if (obj.filePointer.type === PointerType.SubIndexed) {
            indexBlocks = 1 + Math.ceil(obj.pagesInFile / MAX_OBJECT_FILE_POINTERS);
          }
        }
        const totalBlocks = obj.pagesInFile + indexBlocks;
        user.pagesUsed = user.pagesUsed >= totalBlocks ? user.pagesUsed - totalBlocks : 0;
      }
      const freedIndex = obj.objectIndex;
      const owner = obj.userIndex;
      this.objectFile.removeObject(obj.objectIndex);
      this.writeObjectPage(freedIndex);
      this.writeUserPage(owner);
      this.writeBitFile();
    }
    /** Rename a file. */
    rename(oldPath, newPath) {
      this.ensureWritable();
      const obj = this.findObject(oldPath);
      if (!obj)
        throw new Error(`File not found: ${oldPath}`);
      const { objectName, fileType } = this.parsePath(newPath);
      if (!objectName)
        throw new Error("Invalid new path");
      obj.objectName = objectName.toUpperCase().substring(0, NDFS_NAME_MAX);
      obj.type = fileType.toUpperCase().substring(0, NDFS_TYPE_MAX);
      this.writeObjectPage(obj.objectIndex);
    }
    // ── User management ────────────────────────────────────────────────
    /** Get all users. */
    getUsers() {
      return this.userFile.getUsers();
    }
    /** Get a user by index. */
    getUser(index) {
      return this.userFile.getUser(index);
    }
    /** Add a new user. */
    addUser(name, reservedPages) {
      this.ensureWritable();
      if (this.userFile.findUser(name))
        return false;
      const idx = this.userFile.getNextAvailableIndex();
      if (idx < 0)
        return false;
      const user = new UserEntry();
      user.setName(name);
      user.userIndex = idx;
      user.pagesReserved = reservedPages;
      this.userFile.addUser(user);
      this.writeUserPage(user.userIndex);
      return true;
    }
    /** Remove a user (only if they have no files). */
    removeUser(index) {
      this.ensureWritable();
      const files = this.objectFile.getUserObjects(index);
      if (files.length > 0)
        return false;
      const ok = this.userFile.removeUser(index);
      if (ok)
        this.writeUserPage(index);
      return ok;
    }
    /** Update a user's page quota. */
    updateUserQuota(index, newPages) {
      this.ensureWritable();
      const ok = this.userFile.updateUserQuota(index, newPages);
      if (ok)
        this.writeUserPage(index);
      return ok;
    }
    /** Clear a user's password (set to 0). */
    clearUserPassword(indexOrName) {
      this.ensureWritable();
      let user;
      if (typeof indexOrName === "number") {
        user = this.userFile.getUser(indexOrName);
      } else {
        user = this.userFile.findUser(indexOrName);
      }
      if (!user)
        return false;
      user.password = 0;
      this.writeUserPage(user.userIndex);
      return true;
    }
    // ── Friends ────────────────────────────────────────────────────────
    //
    // A user has 0..8 friends in its own entry; a friend grants another user
    // RWACD rights to this user's files. Owner/friend may be a name or a
    // decimal index (0-255). Persists only the owner's user page.
    /** Resolve a user ref (name or index 0-255) to a UserEntry, or null. */
    resolveUserRef(ref) {
      if (typeof ref === "number")
        return this.userFile.getUser(ref);
      if (/^\d+$/.test(ref)) {
        const v = parseInt(ref, 10);
        return v >= 0 && v <= 255 ? this.userFile.getUser(v) : null;
      }
      return this.userFile.findUser(ref);
    }
    /** Resolve a friend ref to a user index (numeric = literal index). */
    resolveFriendIndex(ref) {
      if (typeof ref === "number") {
        if (ref < 0 || ref > 255)
          throw new Error(`User index out of range: ${ref}`);
        return ref;
      }
      if (/^\d+$/.test(ref)) {
        const v = parseInt(ref, 10);
        if (v < 0 || v > 255)
          throw new Error(`User index out of range: ${ref}`);
        return v;
      }
      const u = this.userFile.findUser(ref);
      if (!u)
        throw new Error(`No such user: ${ref}`);
      return u.userIndex;
    }
    /** List a user's friends. Throws if the user does not exist. */
    listFriends(userRef) {
      const owner = this.resolveUserRef(userRef);
      if (!owner)
        throw new Error(`No such user: ${userRef}`);
      const out = [];
      for (const f of owner.friends) {
        if (!f.entryUsed)
          continue;
        const idx = f.friendUserIndex;
        const fu = this.userFile.getUser(idx);
        out.push({
          index: idx,
          name: fu ? fu.userName : "",
          bits: f.bits,
          perms: f.getPermissionString()
        });
      }
      return out;
    }
    /**
     * Add a friend to a user with the given permission letters (default 'RWA').
     * Throws if owner/friend unknown, already a friend, or the list is full.
     */
    addFriend(userRef, friendRef, perms = "RWA") {
      this.ensureWritable();
      const owner = this.resolveUserRef(userRef);
      if (!owner)
        throw new Error(`No such user: ${userRef}`);
      const friendIndex = this.resolveFriendIndex(friendRef);
      const permBits = UserFriend.parsePermissions(perms ? perms : "RWA");
      if (owner.isFriend(friendIndex))
        throw new Error(`Already a friend: ${friendRef}`);
      if (!owner.addFriend(friendIndex, permBits))
        throw new Error("Friend list is full (max 8)");
      this.writeUserPage(owner.userIndex);
    }
    /** Remove a friend from a user. Throws if owner unknown or not a friend. */
    removeFriend(userRef, friendRef) {
      this.ensureWritable();
      const owner = this.resolveUserRef(userRef);
      if (!owner)
        throw new Error(`No such user: ${userRef}`);
      const friendIndex = this.resolveFriendIndex(friendRef);
      if (!owner.removeFriend(friendIndex))
        throw new Error(`Not a friend: ${friendRef}`);
      this.writeUserPage(owner.userIndex);
    }
    // ── Bitmap queries ─────────────────────────────────────────────────
    isBlockUsed(blockId) {
      return this.bitFile.isBlockUsed(blockId);
    }
    getFreePages() {
      return this.bitFile.getFreePages();
    }
    getUsedPages() {
      return this.bitFile.calcUsedPages();
    }
    // ── Low-level access ───────────────────────────────────────────────
    getObjectEntries() {
      return this.objectFile.getObjects();
    }
    getObjectEntry(name, userName) {
      return this.objectFile.findObject(name, userName);
    }
    // ── Boot loader ────────────────────────────────────────────────────
    /** Detect the boot format of this image. */
    detectBootFormat() {
      const page0 = this.readPage(0);
      return detectBootFormat(page0);
    }
    /** Load boot code from this image, or null if no boot format detected. */
    loadBootCode() {
      const page0 = this.readPage(0);
      return loadBootCode(page0);
    }
    /** Check if this image contains bootable code. */
    isBootable() {
      return this.detectBootFormat() !== BootFormat.None;
    }
    // ── Diagnostics ────────────────────────────────────────────────────
    /** Basic integrity verification. */
    verifyIntegrity() {
      if (!this.masterBlock.isValid())
        return false;
      const objects = this.objectFile.getObjects();
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (!obj.filePointer || !obj.filePointer.isValid())
          continue;
        if (!this.bitFile.isBlockUsed(obj.filePointer.blockId))
          return false;
      }
      return true;
    }
    /** Generate a text report about the filesystem. */
    generateReport() {
      const totalPages = this.data.length / NDFS_PAGE_SIZE;
      const usedPages = this.bitFile.calcUsedPages();
      const freePages = this.bitFile.getFreePages();
      const users = this.userFile.getUsers();
      const objects = this.objectFile.getObjects();
      let report = `NDFS Filesystem Report
`;
      report += `======================
`;
      report += `Volume: ${this.masterBlock.directoryName}
`;
      report += `Total pages: ${totalPages}
`;
      report += `Used pages: ${usedPages}
`;
      report += `Free pages: ${freePages}
`;
      report += `Users: ${users.length}
`;
      report += `Files: ${objects.length}

`;
      report += `Users:
`;
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        report += `  [${u.userIndex}] ${u.userName} - Reserved: ${u.pagesReserved}, Used: ${u.pagesUsed}
`;
      }
      report += `
Files:
`;
      for (let i = 0; i < objects.length; i++) {
        const o = objects[i];
        report += `  ${o.userName}/${o.objectName}:${o.type} - ${o.bytesInFile} bytes (${o.pagesInFile} pages)
`;
      }
      return report;
    }
    // ── XAT (Extended Attribute) support ────────────────────────────
    /**
     * Get XAT properties for a file, or null if not found.
     * @param path - "USERNAME/FILENAME:TYPE" or "FILENAME:TYPE"
     */
    getFileProperties(path) {
      const obj = this.findObject(path);
      if (!obj)
        return null;
      return objectEntryToXat(obj);
    }
    /**
     * Read a file's data along with its XAT properties.
     * @param path - "USERNAME/FILENAME:TYPE" or "FILENAME:TYPE"
     */
    readFileWithProperties(path) {
      const obj = this.findObject(path);
      if (!obj)
        throw new Error(`File not found: ${path}`);
      const data = this.readObjectData(obj);
      const properties = objectEntryToXat(obj);
      return { data, properties };
    }
    /**
     * Write a file and apply XAT properties to restore metadata.
     * The file is written first, then the XAT properties are applied
     * to the resulting object entry.
     *
     * @param path - "USERNAME/FILENAME:TYPE" or "FILENAME:TYPE"
     * @param data - The raw bytes to write.
     * @param properties - XAT properties to apply after writing.
     */
    writeFileWithProperties(path, data, properties) {
      this.writeFile(path, data);
      const obj = this.findObject(path);
      if (obj) {
        if (typeof properties["ndfs.access_bits"] === "number") {
          obj.accessBits = properties["ndfs.access_bits"];
        }
        if (typeof properties["ndfs.file_type"] === "number") {
          obj.fileType = properties["ndfs.file_type"];
        }
        if (typeof properties["ndfs.date_created"] === "number") {
          obj.dateCreated = properties["ndfs.date_created"];
        }
        if (typeof properties["ndfs.last_read_date"] === "number") {
          obj.lastDateRead = properties["ndfs.last_read_date"];
        }
        if (typeof properties["ndfs.last_write_date"] === "number") {
          obj.lastDateWritten = properties["ndfs.last_write_date"];
        }
        this.writeObjectPage(obj.objectIndex);
      }
    }
    // ══════════════════════════════════════════════════════════════════
    //  Private implementation
    // ══════════════════════════════════════════════════════════════════
    readPage(blockId) {
      const offset = blockId * NDFS_PAGE_SIZE;
      if (offset + NDFS_PAGE_SIZE > this.data.length) {
        throw new Error(`Block ${blockId} out of range`);
      }
      return this.data.subarray(offset, offset + NDFS_PAGE_SIZE);
    }
    writePage(blockId, pageData) {
      const offset = blockId * NDFS_PAGE_SIZE;
      if (offset + NDFS_PAGE_SIZE > this.data.length) {
        throw new Error(`Block ${blockId} out of range`);
      }
      this.data.set(pageData.subarray(0, NDFS_PAGE_SIZE), offset);
    }
    loadStructures() {
      const mb = this.masterBlock;
      if (mb.userFilePointer && mb.userFilePointer.isValid()) {
        const indexPage = this.readPage(mb.userFilePointer.blockId);
        this.userFile.loadFromPages(indexPage, (id) => this.readPage(id));
        const users = this.userFile.getUsers();
        const userMap = /* @__PURE__ */ new Map();
        for (let i = 0; i < users.length; i++) {
          userMap.set(users[i].userIndex, users[i].userName);
        }
        if (mb.objectFilePointer && mb.objectFilePointer.isValid()) {
          this.objectFile.loadFromPages(mb.objectFilePointer, (id) => this.readPage(id));
          const objects = this.objectFile.getObjects();
          for (let i = 0; i < objects.length; i++) {
            const name = userMap.get(objects[i].userIndex);
            if (name)
              objects[i].userName = name;
          }
        }
      }
      if (mb.bitFilePointer && mb.bitFilePointer.isValid()) {
        const totalPages = this.data.length / NDFS_PAGE_SIZE;
        this.bitFile.initialize(totalPages);
        const bitmapBytes = Math.ceil(totalPages / 8);
        const bitmapPages = Math.ceil(bitmapBytes / NDFS_PAGE_SIZE);
        const bitmapData = new Uint8Array(bitmapPages * NDFS_PAGE_SIZE);
        for (let i = 0; i < bitmapPages; i++) {
          const page = this.readPage(mb.bitFilePointer.blockId + i);
          bitmapData.set(page, i * NDFS_PAGE_SIZE);
        }
        this.bitFile.loadBitmap(bitmapData.subarray(0, bitmapBytes));
      }
    }
    readObjectData(obj) {
      if (!obj.filePointer || obj.filePointer.blockId === 0) {
        return new Uint8Array(0);
      }
      const result = new Uint8Array(obj.bytesInFile);
      let bytesRead = 0;
      if (obj.filePointer.type === PointerType.Contiguous) {
        for (let i = 0; i < obj.pagesInFile && bytesRead < obj.bytesInFile; i++) {
          const page = this.readPage(obj.filePointer.blockId + i);
          const toCopy = Math.min(NDFS_PAGE_SIZE, obj.bytesInFile - bytesRead);
          result.set(page.subarray(0, toCopy), bytesRead);
          bytesRead += toCopy;
        }
      } else if (obj.filePointer.type === PointerType.Indexed) {
        bytesRead = this.readIndexedData(obj.filePointer.blockId, obj, result);
      } else if (obj.filePointer.type === PointerType.SubIndexed) {
        bytesRead = this.readSubIndexedData(obj.filePointer.blockId, obj, result);
      }
      return result;
    }
    readIndexedData(indexBlockId, obj, result) {
      const indexPage = this.readPage(indexBlockId);
      let bytesRead = 0;
      for (let i = 0; i < MAX_OBJECT_FILE_POINTERS && bytesRead < obj.bytesInFile; i++) {
        const ptr = BlockPointer.fromBytes(indexPage, i * 4);
        if (ptr.blockId === 0) {
          const toCopy = Math.min(NDFS_PAGE_SIZE, obj.bytesInFile - bytesRead);
          bytesRead += toCopy;
        } else {
          const page = this.readPage(ptr.blockId);
          const toCopy = Math.min(NDFS_PAGE_SIZE, obj.bytesInFile - bytesRead);
          result.set(page.subarray(0, toCopy), bytesRead);
          bytesRead += toCopy;
        }
      }
      return bytesRead;
    }
    readSubIndexedData(subIndexBlockId, obj, result) {
      const subIndexPage = this.readPage(subIndexBlockId);
      let bytesRead = 0;
      for (let si = 0; si < MAX_OBJECT_FILE_POINTERS && bytesRead < obj.bytesInFile; si++) {
        const indexPtr = BlockPointer.fromBytes(subIndexPage, si * 4);
        if (!indexPtr.isValid())
          continue;
        const indexPage = this.readPage(indexPtr.blockId);
        for (let i = 0; i < MAX_OBJECT_FILE_POINTERS && bytesRead < obj.bytesInFile; i++) {
          const dataPtr = BlockPointer.fromBytes(indexPage, i * 4);
          if (dataPtr.blockId === 0) {
            const toCopy = Math.min(NDFS_PAGE_SIZE, obj.bytesInFile - bytesRead);
            bytesRead += toCopy;
          } else {
            const page = this.readPage(dataPtr.blockId);
            const toCopy = Math.min(NDFS_PAGE_SIZE, obj.bytesInFile - bytesRead);
            result.set(page.subarray(0, toCopy), bytesRead);
            bytesRead += toCopy;
          }
        }
      }
      return bytesRead;
    }
    /**
     * Allocate blocks and write file data to disk.
     * Returns { topBlockId, pointerType, indexBlocksUsed } describing the allocation.
     * Supports indexed (<=512 pages) and sub-indexed (>512 pages) layouts.
     */
    allocateAndWriteData(fileData, dataPages) {
      const useSubIndexed = dataPages > MAX_OBJECT_FILE_POINTERS;
      if (!useSubIndexed) {
        const indexBlockId = this.bitFile.findFirstFreeBlock();
        if (indexBlockId < 0)
          throw new Error("No free blocks for index block");
        this.bitFile.markBlockUsed(indexBlockId);
        const indexPage = new Uint8Array(NDFS_PAGE_SIZE);
        for (let i = 0; i < dataPages; i++) {
          this.writeDataPageToIndex(fileData, i, indexPage, i);
        }
        this.writePage(indexBlockId, indexPage);
        return { topBlockId: indexBlockId, pointerType: PointerType.Indexed, indexBlocksUsed: 1 };
      }
      const subIndexBlockId = this.bitFile.findFirstFreeBlock();
      if (subIndexBlockId < 0)
        throw new Error("No free blocks for sub-index block");
      this.bitFile.markBlockUsed(subIndexBlockId);
      const subIndexPage = new Uint8Array(NDFS_PAGE_SIZE);
      const numIndexBlocks = Math.ceil(dataPages / MAX_OBJECT_FILE_POINTERS);
      let indexBlocksUsed = 1;
      for (let si = 0; si < numIndexBlocks; si++) {
        const idxBlockId = this.bitFile.findFirstFreeBlock();
        if (idxBlockId < 0)
          throw new Error("No free blocks for index block");
        this.bitFile.markBlockUsed(idxBlockId);
        indexBlocksUsed++;
        const idxPtr = new BlockPointer(idxBlockId, PointerType.Contiguous);
        idxPtr.toBytes(subIndexPage, si * 4);
        const indexPage = new Uint8Array(NDFS_PAGE_SIZE);
        const startPage = si * MAX_OBJECT_FILE_POINTERS;
        const endPage = Math.min(startPage + MAX_OBJECT_FILE_POINTERS, dataPages);
        for (let i = startPage; i < endPage; i++) {
          this.writeDataPageToIndex(fileData, i, indexPage, i - startPage);
        }
        this.writePage(idxBlockId, indexPage);
      }
      this.writePage(subIndexBlockId, subIndexPage);
      return { topBlockId: subIndexBlockId, pointerType: PointerType.SubIndexed, indexBlocksUsed };
    }
    /**
     * Write a single data page (sparse-aware) and store its pointer in an index page.
     */
    writeDataPageToIndex(fileData, dataPageIndex, indexPage, slotInIndex) {
      const pageOffset = dataPageIndex * NDFS_PAGE_SIZE;
      const pageEnd = Math.min(pageOffset + NDFS_PAGE_SIZE, fileData.length);
      const pageSlice = fileData.subarray(pageOffset, pageEnd);
      let allZeros = true;
      for (let b = 0; b < pageSlice.length; b++) {
        if (pageSlice[b] !== 0) {
          allZeros = false;
          break;
        }
      }
      if (allZeros && pageSlice.length === NDFS_PAGE_SIZE) {
        writeUint32BE(indexPage, slotInIndex * 4, 0);
      } else {
        const dataBlockId = this.bitFile.findFirstFreeBlock();
        if (dataBlockId < 0)
          throw new Error("No free blocks for data");
        this.bitFile.markBlockUsed(dataBlockId);
        const dataPage = new Uint8Array(NDFS_PAGE_SIZE);
        dataPage.set(pageSlice);
        this.writePage(dataBlockId, dataPage);
        const dataPtr = new BlockPointer(dataBlockId, PointerType.Contiguous);
        dataPtr.toBytes(indexPage, slotInIndex * 4);
      }
    }
    /**
     * Ensure the object-file directory data page holding `objectIndex` exists,
     * allocating and linking it on demand (SINTRAN/RetroCore do this so each
     * user's region grows as needed). The page index in the object-file index
     * block is objectIndex/32; for user U that maps to slots U*8..U*8+7.
     */
    ensureObjectDirPage(objectIndex) {
      const mb = this.masterBlock;
      if (!mb.objectFilePointer || !mb.objectFilePointer.isValid())
        return;
      const pageIdx = Math.floor(objectIndex / ENTRIES_PER_PAGE);
      const allocPage = () => {
        const blk = this.bitFile.findFirstFreeBlock();
        if (blk < 0)
          throw new Error("No free blocks for object directory page");
        this.bitFile.markBlockUsed(blk);
        this.writePage(blk, new Uint8Array(NDFS_PAGE_SIZE));
        return blk;
      };
      if (mb.objectFilePointer.type === PointerType.Indexed) {
        const indexPage = this.readPage(mb.objectFilePointer.blockId);
        const ptr = BlockPointer.fromBytes(indexPage, pageIdx * 4);
        if (ptr.isValid())
          return;
        const blk = allocPage();
        new BlockPointer(blk, PointerType.Contiguous).toBytes(indexPage, pageIdx * 4);
        this.writePage(mb.objectFilePointer.blockId, indexPage);
      } else if (mb.objectFilePointer.type === PointerType.SubIndexed) {
        const subIdx = Math.floor(pageIdx / MAX_OBJECT_FILE_POINTERS);
        const innerIdx = pageIdx % MAX_OBJECT_FILE_POINTERS;
        const subPage = this.readPage(mb.objectFilePointer.blockId);
        let subPtr = BlockPointer.fromBytes(subPage, subIdx * 4);
        if (!subPtr.isValid()) {
          const ib = allocPage();
          new BlockPointer(ib, PointerType.Contiguous).toBytes(subPage, subIdx * 4);
          this.writePage(mb.objectFilePointer.blockId, subPage);
          subPtr = new BlockPointer(ib, PointerType.Contiguous);
        }
        const innerPage = this.readPage(subPtr.blockId);
        const ptr = BlockPointer.fromBytes(innerPage, innerIdx * 4);
        if (ptr.isValid())
          return;
        const blk = allocPage();
        new BlockPointer(blk, PointerType.Contiguous).toBytes(innerPage, innerIdx * 4);
        this.writePage(subPtr.blockId, innerPage);
      }
    }
    createNewFile(objectName, fileType, user, fileData) {
      let dataPages = Math.ceil(fileData.length / NDFS_PAGE_SIZE);
      if (dataPages === 0)
        dataPages = 1;
      const slot = this.objectFile.findFreeUserSlot(user.userIndex);
      if (slot < 0)
        throw new Error(`User ${user.userName} object table is full`);
      this.ensureObjectDirPage(slot);
      const { topBlockId, pointerType, indexBlocksUsed } = this.allocateAndWriteData(fileData, dataPages);
      const entry = new ObjectEntry();
      entry.objectIndex = slot;
      entry.objectName = objectName.toUpperCase().substring(0, NDFS_NAME_MAX);
      entry.type = fileType.toUpperCase().substring(0, NDFS_TYPE_MAX);
      entry.userIndex = user.userIndex;
      entry.userName = user.userName;
      entry.pagesInFile = dataPages;
      entry.bytesInFile = fileData.length > 0 ? fileData.length : 1;
      entry.filePointer = new BlockPointer(topBlockId, pointerType);
      entry.accessBits = ACCESS_DEFAULT;
      entry.fileTypeFlags = pointerType === PointerType.Contiguous ? FT_CONTIGUOUS : FT_INDEXED;
      entry.diskObjectIndex = entry.objectIndex;
      entry.nextVersion = entry.objectIndex;
      entry.prevVersion = entry.objectIndex;
      this.objectFile.addObject(entry);
      user.pagesUsed += dataPages + indexBlocksUsed;
      this.writeObjectPage(entry.objectIndex);
      this.writeUserPage(user.userIndex);
      this.writeBitFile();
    }
    updateExistingFile(existing, user, fileData) {
      let oldIndexBlocks = 1;
      if (existing.filePointer && existing.filePointer.type === PointerType.SubIndexed) {
        oldIndexBlocks = 1 + Math.ceil(existing.pagesInFile / MAX_OBJECT_FILE_POINTERS);
      }
      const oldTotal = existing.pagesInFile + oldIndexBlocks;
      this.freeFileBlocks(existing);
      user.pagesUsed = user.pagesUsed >= oldTotal ? user.pagesUsed - oldTotal : 0;
      let dataPages = Math.ceil(fileData.length / NDFS_PAGE_SIZE);
      if (dataPages === 0)
        dataPages = 1;
      const { topBlockId, pointerType, indexBlocksUsed } = this.allocateAndWriteData(fileData, dataPages);
      existing.pagesInFile = dataPages;
      existing.bytesInFile = fileData.length > 0 ? fileData.length : 1;
      existing.filePointer = new BlockPointer(topBlockId, pointerType);
      user.pagesUsed += dataPages + indexBlocksUsed;
      this.writeObjectPage(existing.objectIndex);
      this.writeUserPage(user.userIndex);
      this.writeBitFile();
    }
    freeFileBlocks(obj) {
      if (!obj.filePointer || obj.filePointer.blockId === 0)
        return;
      if (obj.filePointer.type === PointerType.Indexed) {
        const indexPage = this.readPage(obj.filePointer.blockId);
        for (let i = 0; i < MAX_OBJECT_FILE_POINTERS; i++) {
          const ptr = BlockPointer.fromBytes(indexPage, i * 4);
          if (ptr.blockId > 0) {
            this.bitFile.markBlockFree(ptr.blockId);
          }
        }
        this.bitFile.markBlockFree(obj.filePointer.blockId);
      } else if (obj.filePointer.type === PointerType.Contiguous) {
        this.bitFile.freeBlocks(obj.filePointer.blockId, obj.pagesInFile);
      } else if (obj.filePointer.type === PointerType.SubIndexed) {
        const subIndexPage = this.readPage(obj.filePointer.blockId);
        for (let si = 0; si < MAX_OBJECT_FILE_POINTERS; si++) {
          const indexPtr = BlockPointer.fromBytes(subIndexPage, si * 4);
          if (!indexPtr.isValid())
            continue;
          const indexPage = this.readPage(indexPtr.blockId);
          for (let i = 0; i < MAX_OBJECT_FILE_POINTERS; i++) {
            const dataPtr = BlockPointer.fromBytes(indexPage, i * 4);
            if (dataPtr.blockId > 0)
              this.bitFile.markBlockFree(dataPtr.blockId);
          }
          this.bitFile.markBlockFree(indexPtr.blockId);
        }
        this.bitFile.markBlockFree(obj.filePointer.blockId);
      }
    }
    /**
     * Persist all three structures to the image buffer.
     * Order: BitFile -> UserFile -> ObjectFile (matching C# reference).
     */
    // NDFS writes are immediate and surgical (matching RetroCommander/RetroCore):
    // a mutation rewrites ONLY the block(s) it touched, never the whole
    // filesystem. Each helper rebuilds a single 2048-byte page from the
    // in-memory model; rebuilding zero-filled also clears freed slots so a
    // deleted file/user does not reappear on reload.
    /** Write the BitFile allocation bitmap (small, contiguous). */
    writeBitFile() {
      const mb = this.masterBlock;
      if (!mb.bitFilePointer || !mb.bitFilePointer.isValid())
        return;
      const pages = this.bitFile.toPageBuffers();
      for (let i = 0; i < pages.length; i++) {
        this.writePage(mb.bitFilePointer.blockId + i, pages[i]);
      }
    }
    /** Write only the UserFile data page holding `userIndex`. */
    writeUserPage(userIndex) {
      const mb = this.masterBlock;
      if (!mb.userFilePointer || !mb.userFilePointer.isValid())
        return;
      const pageIndex = Math.floor(userIndex / ENTRIES_PER_PAGE);
      if (pageIndex >= MAX_USER_FILE_POINTERS)
        return;
      const indexPage = this.readPage(mb.userFilePointer.blockId);
      const ptr = BlockPointer.fromBytes(indexPage, pageIndex * 4);
      if (!ptr.isValid())
        return;
      this.writePage(ptr.blockId, this.userFile.toDataPage(pageIndex));
    }
    /** Resolve the on-disk data block backing ObjectFile page `pageIndex`. */
    objectPageBlock(pageIndex) {
      const mb = this.masterBlock;
      if (!mb.objectFilePointer || !mb.objectFilePointer.isValid())
        return null;
      if (mb.objectFilePointer.type === PointerType.Indexed) {
        if (pageIndex >= MAX_OBJECT_FILE_POINTERS)
          return null;
        const indexPage = this.readPage(mb.objectFilePointer.blockId);
        const ptr = BlockPointer.fromBytes(indexPage, pageIndex * 4);
        return ptr.isValid() ? ptr.blockId : null;
      }
      if (mb.objectFilePointer.type === PointerType.SubIndexed) {
        const subIdx = Math.floor(pageIndex / MAX_OBJECT_FILE_POINTERS);
        const innerIdx = pageIndex % MAX_OBJECT_FILE_POINTERS;
        const subIndexPage = this.readPage(mb.objectFilePointer.blockId);
        const subPtr = BlockPointer.fromBytes(subIndexPage, subIdx * 4);
        if (!subPtr.isValid())
          return null;
        const innerIndexPage = this.readPage(subPtr.blockId);
        const dataPtr = BlockPointer.fromBytes(innerIndexPage, innerIdx * 4);
        return dataPtr.isValid() ? dataPtr.blockId : null;
      }
      return null;
    }
    /**
     * Write only the ObjectFile data page holding `objectIndex`.
     * Rebuilt zero-filled, which clears any slot freed by a delete.
     */
    writeObjectPage(objectIndex) {
      const pageIndex = Math.floor(objectIndex / ENTRIES_PER_PAGE);
      const dataBlock = this.objectPageBlock(pageIndex);
      if (dataBlock === null)
        return;
      this.writePage(dataBlock, this.objectFile.toDataPage(pageIndex));
    }
    findObject(path) {
      const { userName, objectName, fileType } = this.parsePath(path);
      const searchName = objectName ? fileType ? `${objectName}:${fileType}` : objectName : "";
      const objects = this.objectFile.getObjects();
      for (let i = 0; i < objects.length; i++) {
        const o = objects[i];
        if (userName && o.userName.toUpperCase() !== userName.toUpperCase())
          continue;
        const fullName = o.type ? `${o.objectName}:${o.type}` : o.objectName;
        if (fullName.toUpperCase() === searchName.toUpperCase())
          return o;
        if (!fileType && o.objectName.toUpperCase() === objectName.toUpperCase())
          return o;
      }
      return null;
    }
    parsePath(path) {
      const normalized = path.replace(/^\/+|\/+$/g, "");
      const parts = normalized.split("/");
      let userName = "";
      let fileNamePart = "";
      if (parts.length >= 2) {
        userName = parts[0];
        fileNamePart = parts.slice(1).join("/");
      } else {
        fileNamePart = parts[0];
      }
      let objectName = fileNamePart;
      let fileType = "";
      const colonIdx = fileNamePart.indexOf(":");
      if (colonIdx >= 0) {
        objectName = fileNamePart.substring(0, colonIdx);
        fileType = fileNamePart.substring(colonIdx + 1);
      } else {
        const dotIdx = fileNamePart.lastIndexOf(".");
        if (dotIdx >= 0) {
          objectName = fileNamePart.substring(0, dotIdx);
          fileType = fileNamePart.substring(dotIdx + 1);
        }
      }
      return { userName, objectName, fileType };
    }
    resolveUser(userName) {
      if (userName) {
        return this.userFile.findUser(userName);
      }
      const users = this.userFile.getUsers();
      return users.length > 0 ? users[0] : null;
    }
    ensureWritable() {
      if (this.readOnly) {
        throw new Error("Filesystem is read-only");
      }
    }
  };
  return __toCommonJS(index_exports);
})();
