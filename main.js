// Credit: https://github.com/wiecosystem/Bluetooth

export default class Metrics {
  
  constructor(weight, impedance, height, age, sex) {
    this.weight = weight;
    this.impedance = impedance;
    this.height = height;
    this.age = age;
    this.sex = sex;
  }

  getResult = () => {
    return [
      { name: 'BMI', value: this.getBMI() },
      { name: 'Ideal Weight', value: this.getIdealWeight() },
      { name: 'Metabolic Age', value: this.getMetabolicAge() },
      { name: 'Protein Percentage', value: this.getProteinPercentage() },
      { name: 'LBM Coefficient', value: this.getLBMCoefficient() },
      { name: 'BMR', value: this.getBMR() },
      { name: 'Fat', value: this.getFatPercentage() },
      { name: 'Muscle Mass', value: this.getMuscleMass() },
      { name: 'Bone Mass', value: this.getBoneMass() },
      { name: 'Visceral Fat', value: this.getVisceralFat() }
    ]
  }

  checkValueOverflow = (value, minimum, maximum) => {
    if (value < minimum) return minimum
    else if (value > maximum) return maximum
    return value
  }

  getIdealWeight = () => {
    if (this.sex == 'female') return (this.height - 70) * 0.6
    return (this.height - 80) * 0.7
  }

  getMetabolicAge = () => {
    let metabolicAge = (this.height * -0.7471) + (this.weight * 0.9161) + (this.age * 0.4184) + (this.impedance * 0.0517) + 54.2267
    if (this.sex == 'female') {
      metabolicAge = (this.height * -1.1165) + (this.weight * 1.5784) + (this.age * 0.4615) + (this.impedance * 0.0415) + 83.2548
    }
    return this.checkValueOverflow(metabolicAge, 15, 80)
  }

  getVisceralFat = () => {
    let subsubcalc, subcalc, vfal
    if (this.sex === 'female') {
      if (this.weight > (13 - (this.height * 0.5)) * -1) {
        subsubcalc = ((this.height * 1.45) + (this.height * 0.1158) * this.height) - 120
        subcalc = this.weight * 500 / subsubcalc
        vfal = (subcalc - 6) + (this.age * 0.07)
      } else {
        subcalc = 0.691 + (this.height * -0.0024) + (this.height * -0.0024)
        vfal = (((this.height * 0.027) - (subcalc * this.weight)) * -1) + (this.age * 0.07) - this.age
      }
    } else if (this.height < this.weight * 1.6) {
      subcalc = ((this.height * 0.4) - (this.height * (this.height * 0.0826))) * -1
      vfal = ((this.weight * 305) / (subcalc + 48)) - 2.9 + (this.age * 0.15)
    } else {
      subcalc = 0.765 + this.height * -0.0015
      vfal = (((this.height * 0.143) - (this.weight * subcalc)) * -1) + (this.age * 0.15) - 5.0
    }
    return this.checkValueOverflow(vfal, 1, 50)
  }

  getProteinPercentage = () => {
    let proteinPercentage = (this.getMuscleMass() / this.weight) * 100
    proteinPercentage -= this.getWaterPercentage()

    return this.checkValueOverflow(proteinPercentage, 5, 32)
  }

  getWaterPercentage = () => {
    let waterPercentage = (100 - this.getFatPercentage()) * 0.7
    let coefficient = 0.98
    if (waterPercentage <= 50) coefficient = 1.02
    if (waterPercentage * coefficient >= 65) waterPercentage = 75
    return this.checkValueOverflow(waterPercentage * coefficient, 35, 75)
  }

  getBMI = () => {
    return this.checkValueOverflow(this.weight / ((this.height / 100) * (this.height / 100)), 10, 90)
  }

  getBMR = () => {
    let bmr
    if (this.sex === 'female') {
      bmr = 864.6 + this.weight * 10.2036
      bmr -= this.height * 0.39336
      bmr -= this.age * 6.204
    } else {
      bmr = 877.8 + this.weight * 14.916
      bmr -= this.height * 0.726
      bmr -= this.age * 8.976
    }

    if (this.sex === 'female' && bmr > 2996) bmr = 5000
    else if (this.sex === 'male' && bmr > 2322) bmr = 5000
    return this.checkValueOverflow(bmr, 500, 10000)
  }

  getFatPercentage = () => {
    let value = 0.8
    if (this.sex === 'female' && this.age <= 49) value = 9.25
    else if (this.sex === 'female' && this.age > 49) value = 7.25

    const LBM = this.getLBMCoefficient()
    let coefficient = 1.0

    if (this.sex == 'male' && this.weight < 61) coefficient = 0.98
    else if (this.sex == 'female' && this.weight > 60) {
      if (this.height > 160) {
        coefficient *= 1.03
      } else {
        coefficient = 0.96
      }
    }
    else if (this.sex == 'female' && this.weight < 50) {
      if (this.height > 160) {
        coefficient *= 1.03
      } else {
        coefficient = 1.02
      }
    }
    let fatPercentage = (1.0 - (((LBM - value) * coefficient) / this.weight)) * 100

    if (fatPercentage > 63) fatPercentage = 75
    return this.checkValueOverflow(fatPercentage, 5, 75)
  }

  getMuscleMass = () => {
    let muscleMass = this.weight - ((this.getFatPercentage() * 0.01) * this.weight) - this.getBoneMass()
    if (this.sex == 'female' && muscleMass >= 84) muscleMass = 120
    else if (this.sex == 'male' && muscleMass >= 93.5) muscleMass = 120
    return this.checkValueOverflow(muscleMass, 10, 120)
  }

  getBoneMass = () => {
    let base = 0.18016894
    if (this.sex == 'female') base = 0.245691014

    let boneMass = (base - (this.getLBMCoefficient() * 0.05158)) * -1

    if (boneMass > 2.2) boneMass += 0.1
    else boneMass -= 0.1

    if (this.sex == 'female' && boneMass > 5.1) boneMass = 8
    else if (this.sex == 'male' && boneMass > 5.2) boneMass = 8

    return this.checkValueOverflow(boneMass, 0.5, 8)
  }

  getLBMCoefficient = () => {
    let lbm = (this.height * 9.058 / 100) * (this.height / 100)
    lbm += this.weight * 0.32 + 12.226
    lbm -= this.impedance * 0.0068
    lbm -= this.age * 0.0542
    return lbm
  }
}


let scan

const computeData = (data) => {
  const buffer = new Uint8Array(data.buffer)
  const ctrlByte1 = buffer[1]
  const stabilized = ctrlByte1 & (1 << 5)
  const weight = ((buffer[12] << 8) + buffer[11]) / 200
  const impedance = (buffer[10] << 8) + buffer[9]
  if (stabilized > 0) {
    document.querySelector('.progress').removeAttribute('hidden')
  } else {
    document.querySelector('.progress').setAttribute('hidden', '')
  }
  if (impedance > 0 && impedance < 3000 && stabilized) {
    scan.stop()
    const height = document.querySelector('input[name="height"]').value
    const age = document.querySelector('input[name="age"]').value
    const gender = document.querySelector('select[name="gender"]').value
    const metrics = new Metrics(weight, impedance, height, age, gender)
    metrics.getResult().map(item => {
      const html =`<div class="item"><div class="name">${item.name}</div><div class="value">${parseFloat(item.value).toFixed(2)}</div></div>`
      document.querySelector('.result').innerHTML += html
    })
    document.querySelector('.result').removeAttribute('hidden')
    document.querySelector('.progress').setAttribute('hidden', '')
  }
  document.querySelector('.value').innerHTML = parseFloat(weight).toFixed(1)
}

const onButtonClick = async () => {
  try {
    scan = await navigator.bluetooth.requestLEScan({
      acceptAllAdvertisements: true
    })
    document.querySelector('.button.start').setAttribute('hidden', '')
    document.querySelector('.loading').removeAttribute('hidden')
    document.querySelector('.form').setAttribute('hidden', '')
    navigator.bluetooth.addEventListener('advertisementreceived', event => {
      if (event.device.name !== 'MIBCS') return
      document.querySelector('.loading').setAttribute('hidden', '')
      document.querySelector('.scale').removeAttribute('hidden')
      event.serviceData.forEach((valueDataView) => {  
        computeData(valueDataView)
      })
    })
  } catch (e) {
    if (e.code === 11) return
    if (e.code === 0) {
      alert('Bluetooth scanning permission denied. Please update browser settings to allow access.')
      return
    }
    console.log(e.message)
    alert(e.message)
  }
}

const onInputChange = (e) => {
  const height = document.querySelector('input[name="height"]').value
  const age = document.querySelector('input[name="age"]').value
  if (height > 0 && age > 0) {
    document.querySelector('.button.start').removeAttribute('disabled')
  } else {
    document.querySelector('.button.start').setAttribute('disabled', '')
  }
}

document.querySelector('input[name="height"]').addEventListener('keyup', onInputChange)
document.querySelector('input[name="age"]').addEventListener('keyup', onInputChange)
document.querySelector('.button.start').addEventListener('click', onButtonClick)


