// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Does not touch the vault. Only claims "pre = 10 ETH, post = 0".
contract FakeDeployer {
    constructor(address) payable {
        bytes memory out = abi.encode(uint256(10 ether), uint256(0));
        assembly { return(add(out, 0x20), mload(out)) }
    }
}
