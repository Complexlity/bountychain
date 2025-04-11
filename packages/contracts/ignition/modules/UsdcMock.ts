import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule("UsdcMock", (m) => {
    const usdcMock = m.contract('UsdcMock', [])
    return {usdcMock}
})