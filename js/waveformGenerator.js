// This object represent the waveform generator
var WaveformGenerator = {
    // The generateWaveform function takes 4 parameters:
    //     - type, the type of waveform to be generated
    //     - frequency, the frequency of the waveform to be generated
    //     - amp, the maximum amplitude of the waveform to be generated
    //     - duration, the length (in seconds) of the waveform to be generated
    generateWaveform: function(type, frequency, amp, duration) {
        var nyquistFrequency = sampleRate / 2; // Nyquist frequency
        var totalSamples = Math.floor(sampleRate * duration); // Number of samples to generate
        var result = []; // The temporary array for storing the generated samples

        switch(type) {
            case "sine-time": // Sine wave, time domain
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    result.push(amp * Math.sin(2.0 * Math.PI * frequency * currentTime));
                }
                break;

            case "square-time": // Square wave, time domain
                /**
                * TODO: Complete this generator
                **/
                var oneCycle = sampleRate / frequency;
                var halfCycle = oneCycle / 2;
                for (var i = 0; i < totalSamples; i++) {
                    var whereInTheCycle = i % parseInt(oneCycle);
                    if (whereInTheCycle < halfCycle)
                        // first half of the cycle
                        result.push(amp); // Assume the highest value is 1
                    else
                        // second half of the cycle
                        result.push(-amp); // Assume the lowest value is -1
                }
                break;

            case "square-additive": // Square wave, additive synthesis
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    var k = 1;
                    while (k * frequency < sampleRate / 2.0) {
                        sample += (1.0 / k) * Math.sin(2 * Math.PI * k * frequency * currentTime);
                        k += 2;
                    }
                    result.push(amp * sample);
                }

                break;

            case "sawtooth-time": // Sawtooth wave, time domain
                /**
                * TODO: Complete this generator
                **/
                var oneCycle = sampleRate / frequency; 
                for (var i = 0; i < totalSamples; i++) {
                    var whereInTheCycle = i % parseInt(oneCycle); 
                    var fractionInTheCycle = whereInTheCycle / oneCycle;
                    result.push(amp * (2 * (1.0 - fractionInTheCycle ) - 1.0));
                }
                break;

            case "sawtooth-additive": // Sawtooth wave, additive synthesis
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    var k = 1;
                    while (k * frequency < sampleRate / 2.0) {
                        sample += (1.0 / k) * Math.sin(2 * Math.PI * k * frequency * currentTime);
                        k += 1;
                    }
                    result.push(amp * sample);
                }
          
                break;

            case "triangle-additive": // Triangle wave, additive synthesis
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    var k = 1;
                    while (k * frequency < sampleRate / 2.0) {
                        sample += (1.0 / k ** 2) * Math.cos(2 * Math.PI * k * frequency * currentTime);
                        k += 2;
                    }
                    result.push(amp * sample);
                }

                break;

            case "customized-additive-synthesis": // Customized additive synthesis
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
				var harmonics = [];
				for (var h = 1; h <= 10; ++h) {
					harmonics.push($("#additive-f" + h).val());
				}
                
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    var sample = 0;
                    for (var h = 0; (h + 1) * frequency < sampleRate / 2.0 && h < 10; ++h) {
                        sample += parseFloat(harmonics[h]) * Math.sin(2 * Math.PI * (h + 1) * frequency * currentTime);
                    }
                    result.push(amp * sample);
                }

                break;

            case "white-noise": // White noise
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    result.push(amp * (Math.random() * 2 - 1));
                }
                break;

            case "karplus-strong": // Karplus-Strong algorithm
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var base = $("#karplus-base>option:selected").val();
                var b = parseFloat($("#karplus-b").val());
                var delay = parseInt($("#karplus-p").val());
                var useFreq = $("#karplus-use-freq").prop("checked");

                if (useFreq) {
                    delay = Math.floor(sampleRate / frequency);
                }

                var buffer = [];
                if (base === "white-noise") {
                    for (var i = 0; i < delay; ++i) {
                        buffer.push(amp * (Math.random() * 2 - 1));
                    }
                } else if (base === "sawtooth") {
                    for (var i = 0; i < delay; ++i) {
                        buffer.push(amp * (2 * (1 - i / delay) - 1));
                    }
                }
                
                for (var i = 0; i < totalSamples; ++i) {
                    if (i <= delay) {
                        result.push(buffer[i%delay]);
                    } else {
                        if (Math.random() < b) {
                            result.push(0.5 * (result[i - delay] + result[i - delay + 1]));
                        } else {
                            result.push(-0.5 * (result[i - delay] + result[i - delay + 1]));
                        }
                    }
                }

                break;

            case "fm": // FM
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var carrierFrequency = parseFloat($("#fm-carrier-frequency").val());
                var carrierAmplitude = parseFloat($("#fm-carrier-amplitude").val());
                var modulationFrequency = parseFloat($("#fm-modulation-frequency").val());
                var modulationAmplitude = parseFloat($("#fm-modulation-amplitude").val());
                var useADSR = $("#fm-use-adsr").prop("checked");
                var useFreqMultiplier = $("#fm-use-freq-multiplier").prop("checked");

                if(useFreqMultiplier) { // Obtain the frequency multiplier parameters
                    carrierFrequency *= frequency;
                    modulationFrequency *= frequency;
                }

                if(useADSR) { // Obtain the ADSR parameters
                    var attackDuration = parseFloat($("#fm-adsr-attack-duration").val()) * sampleRate;
                    var decayDuration = parseFloat($("#fm-adsr-decay-duration").val()) * sampleRate;
                    var releaseDuration = parseFloat($("#fm-adsr-release-duration").val()) * sampleRate;
                    var sustainLevel = parseFloat($("#fm-adsr-sustain-level").val()) / 100.0; 
                }

                for (var i = 0; i < totalSamples; ++i) { 
                    var modulationAmplitudeEnvelope = 1.0;
                    if(useADSR) { // Apply the ADSR envelope 
                        // Calculate the ADSR envelope value based on the current sample index
                        var envelopeValue = 0.0;
                        if (i < attackDuration) {
                            // Attack phase
                            envelopeValue = lerp(0.0, 1.0, i / attackDuration);
                        } else if (i < attackDuration + decayDuration) {
                            // Decay phase
                            envelopeValue = lerp(1.0, sustainLevel, (i - attackDuration) / decayDuration);
                        } else if (i >= totalSamples - releaseDuration) {
                            // Release phase
                            envelopeValue = lerp(sustainLevel, 0.0, (i - (totalSamples - releaseDuration)) / releaseDuration);
                        } else {
                            // Sustain phase
                            envelopeValue = sustainLevel;
                        }
                        
                        // Apply the ADSR envelope to modulation amplitude
                        modulationAmplitudeEnvelope *= envelopeValue;
                    }

                    var currentTime = i / sampleRate;
                    var sample = carrierAmplitude * Math.sin(2 * Math.PI * carrierFrequency * currentTime
                                 + modulationAmplitude * modulationAmplitudeEnvelope * Math.sin(2 * Math.PI * modulationFrequency * currentTime));

                    result.push(amp * sample);
                }

                break;

            case "repeating-narrow-pulse": // Repeating narrow pulse
                var cycle = Math.floor(sampleRate / frequency);
                for (var i = 0; i < totalSamples; ++i) {
                    if(i % cycle === 0) {
                        result.push(amp * 1.0);
                    } else if(i % cycle === 1) {
                        result.push(amp * -1.0);
                    } else {
                        result.push(0.0);
                    }
                }
                break;

            default:
                break;
        }

        return result;
    }
};
