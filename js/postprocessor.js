// This object represent the postprocessor
Postprocessor = {
    // The postprocess function takes the audio samples data and the post-processing effect name
    // and the post-processing stage as function parameters. It gathers the required post-processing
    // paramters from the <input> elements, and then applies the post-processing effect to the
    // audio samples data of every channels.
    postprocess: function (channels, effect, pass) {
        switch (effect) {
            case "no-pp":
                // Do nothing
                break;

            case "reverse":
                /**
                * TODO: Complete this function
                **/

                // Post-process every channels
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    // Apply the post-processing, i.e. reverse
                    audioSequence.data.reverse();
                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "boost":
                // Find the maximum gain of all channels
                var maxGain = -1.0;
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    var gain = audioSequence.getGain();
                    if (gain > maxGain) {
                        maxGain = gain;
                    }
                }

                // Determine the boost multiplier
                var multiplier = 1.0 / maxGain;

                // Post-process every channels
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // For every sample, apply a boost multiplier
                    for (var i = 0; i < audioSequence.data.length; ++i) {
                        audioSequence.data[i] *= multiplier;
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "adsr":
                /**
                * TODO: Complete this function
                **/

                // Obtain all the required parameters
                var attackDuration = parseFloat($("#adsr-attack-duration").data("p" + pass)) * sampleRate;
                var decayDuration = parseFloat($("#adsr-decay-duration").data("p" + pass)) * sampleRate;
                var releaseDuration = parseFloat($("#adsr-release-duration").data("p" + pass)) * sampleRate;
                var sustainLevel = parseFloat($("#adsr-sustain-level").data("p" + pass)) / 100.0;

                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    for (var i = 0; i < audioSequence.data.length; ++i) {

                        // TODO: Complete the ADSR postprocessor
                        // Hinst: You can use the function lerp() in utility.js
                        // for performing linear interpolation
                        if (i < attackDuration) {
                            audioSequence.data[i] *= lerp(0, 1, i / (attackDuration - 1));
                        } else if (i < attackDuration + decayDuration) {
                            audioSequence.data[i] *= lerp(1, sustainLevel, (i - attackDuration) / (decayDuration - 1));
                        } else if (i < audioSequence.data.length - releaseDuration) {
                            audioSequence.data[i] *= sustainLevel;
                        } else {
                            audioSequence.data[i] *= lerp(sustainLevel, 0, (i - (audioSequence.data.length - releaseDuration)) / (releaseDuration - 1));
                        }
                    }
                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "tremolo":
                /**
                * TODO: Complete this function
                **/

                // Obtain all the required parameters
                var tremoloFrequency = parseFloat($("#tremolo-frequency").data("p" + pass));
                var wetness = parseFloat($("#tremolo-wetness").data("p" + pass));

                // Post-process every channels
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    // For every sample, apply a tremolo multiplier
                    for (var i = 0; i < audioSequence.data.length; ++i) {
                        var currentTime = i / sampleRate;
                        var multiplier = (Math.sin(2.0 * Math.PI * tremoloFrequency * currentTime + Math.PI * 3 / 2) + 1.0) / 2.0;  // multiplier = (sin(2πft) + 1) / 2
                        multiplier = multiplier * wetness + (1.0 - wetness); // multiplier = multiplier × wetness + (1 - wetness)
                        audioSequence.data[i] *= multiplier;
                    }
                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "echo":
                /**
                * TODO: Complete this function
                **/

                // Obtain all the required parameters
                var delayLineDuration = parseFloat($("#echo-delay-line-duration").data("p" + pass));
                var multiplier = parseFloat($("#echo-multiplier").data("p" + pass));

                // Post-process every channels
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    // Create a new empty delay line
                    var delayLineSize = sampleRate * delayLineDuration;
                    var delayLine = [];
                    for (var i = 0; i < delayLineSize; i++)
                        delayLine.push(0);

                    // var clippingCount = 0;
                    for (var i = 0; i < audioSequence.data.length; ++i) {
                        // Get the echoed sample from the delay line
                        var delayLineOutput = delayLine[i % delayLineSize];

                        // Add the echoed sample to the current sample, with a multiplier
                        audioSequence.data[i] = audioSequence.data[i] + delayLineOutput * multiplier;
                        /* Clipping situation
                        if ((audioSequence.data[i] > 1.0) || (audioSequence.data[i] < -1.0)) {
                            clippingCount++; // Count bad samples
                        } 
                         */
                        // Put the current sample into the delay line
                        delayLine[i % delayLineSize] = audioSequence.data[i];

                    }
                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "adjust": //!!!
                // Obtain all the required parameters
                var a_t = parseFloat($("#adjust-duration").data("p" + pass));
                var a_p = parseFloat($("#adjust-pitch").data("p" + pass));
                var timeMul = a_t * a_p;
                var freq = sampleRate / a_p;
                var downsizedHz = sampleRate / 6;

                var D_max = parseInt((40 / 1000) * sampleRate);     // max discrepancy: # of samples for 40ms
                var L_s_min = parseInt((10 / 1000) * sampleRate);   // min segment duration: 10ms
                var L_s_max = parseInt((25 / 1000) * sampleRate);   // max segment duration: 25ms
                var T_a = parseInt((40 / 1000) * sampleRate);       // autocorrelation window duration: 40ms
                var T_c = parseInt((30 / 1000) * sampleRate);       // crossfade length: 30ms


                // Post-process every channels
                for (var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var oldAudioSequence = channels[c].audioSequenceReference;
                    var length = parseInt(oldAudioSequence.data.length * timeMul);
                    var sequence = new AudioSequence();
                    sequence.sampleRate = sampleRate;
                    sequence.data = [];

                    // var N_s = 2 * Math.abs(timeMul - 1) / (L_s_min + L_s_max);    // average # of splicings/sec                   
                    if (timeMul !== 1) {
                        // for time
                        for (var i = 0; i < oldAudioSequence.data.length && sequence.data.length < length;) {
                            for (; i < oldAudioSequence.data.length && sequence.data.length < length; ++i) {
                                if (Math.abs(sequence.data.length - parseInt(i * timeMul)) <= D_max) {
                                    sequence.data.push(oldAudioSequence.data[i]); // t_o = t_i
                                } else {
                                    break;
                                }
                            }

                            // duplicate / discard
                            var L_s = 0; // t0
                            var maxSum = 0;
                            if (timeMul < 1) { // compression, +ve L_s (L_s > 0), discard
                                for (var t = L_s_min; t <= L_s_max; t++) { // finding L_s
                                    var sum = 0;
                                    // console.log("discard");
                                    for (var k = 1; k <= T_a - t; k++)
                                        sum += oldAudioSequence.data[i + k] * oldAudioSequence.data[i + t + k];

                                    sum /= T_a - t;

                                    if (maxSum < sum){
                                        L_s = t;
                                        maxSum = sum;
                                    }
                                }
                                var current = sequence.data.length;
                                for (var j = 0; j < L_s && i < oldAudioSequence.data.length && sequence.data.length < length; j++) {
                                    var mul = (j) / (L_s);
                                    sequence.data[current - L_s + j] = sequence.data[current - L_s + j] * (1.0 - mul) + oldAudioSequence.data[i] * (mul); // linear crossfade
                                    ++i;
                                }
                            } else { // timeMul > 1, strectching, -ve L_s (L_s < 0), duplicate
                                for (var t = -1 * L_s_min; t >= -1 * L_s_max; t--) { // finding L_s
                                    var sum = 0;
                                    for (var k = 1; k <= T_a - t; k++) {
                                        sum += oldAudioSequence.data[i + k] * oldAudioSequence.data[i + t + k];
                                        //console.log("sum: ", sum);
                                    }
                                    
                                    sum /= T_a - t;

                                    if (maxSum <= sum) {
                                        L_s = t;
                                        maxSum = sum;
                                    }
                                }
                                
                                var current = sequence.data.length;
                                for (var j = 0; j > L_s && i < oldAudioSequence.data.length && sequence.data.length < length; j--) {
                                    var mul = (j) / (L_s);
                                    sequence.data[current + (L_s - j)] = sequence.data[current + (L_s - j)] * (1.0 - mul) + oldAudioSequence.data[i] * (mul); // linear crossfade
                                    ++i;
                                }

                                for (var k = -T_a + L_s; k <= 0 && i < oldAudioSequence.data.length && sequence.data.length < length; k++) { // duplicated sound
                                    sequence.data.push(oldAudioSequence.data[i + k]);
                                }
                                


                                /*
                                var current = sequence.data.length;
                                // copy from i to i + L_s
                                for (var j = 0; j < -L_s && i < oldAudioSequence.data.length && sequence.data.length < length; j++) {
                                    sequence.data.push(oldAudioSequence.data[i + j]);

                                    var mul = (j) / (-L_s);
                                    sequence.data[current + j] = sequence.data[current + j] * (1.0 - mul) + oldAudioSequence.data[i - L_s] * (mul); // linear crossfade
                                    ++i;
                                }

                                // duplicate
                                for (var k = 0; k < -L_s && i < oldAudioSequence.data.length && sequence.data.length < length; k++) { // duplicated sound
                                    sequence.data.push(oldAudioSequence.data[k + i - L_s]);
                                }
                                */
                                
                            }
                        }

                        // for pitch 
                        if (a_p !== 1) {
                            console.log("a_p !== 1");
                            var sequence2 = new AudioSequence();
                            sequence2.sampleRate = sampleRate;
                            sequence2.data = [];
                            // var length2 = parseInt(sequence.data.length * pitchMul);

                            var ratio = freq / sampleRate;
                            for (var i = 0; i < sequence.data.length * ratio; ++i) {
                                if (j < 1) {
                                    var x = parseInt(i * a_p);
                                    sequence2.data.push(sequence.data[x]);
                                } else {
                                    // y = y1 + (x - x1) * (y2 - y1)/(x2 - x1);
                                    sequence2.data.push(sequence.data[i]);
                                    for (var j = 0; j < parseInt(ratio); j++) {
                                        if (i - 2 < 0)
                                            sequence2.data.push(sequence.data[i]);
                                        else
                                            sequence2.data.push(sequence2.data[sequence2.data.length - 2] + (sequence.data[i] - sequence.data[i - 1])
                                                * (sequence2.data[sequence2.data.length - 3] - sequence2.data[sequence2.data.length - 2])
                                                / (sequence.data[i - 2] - sequence.data[i - 1]));
                                    }

                                }
                            }
                            channels[c].setAudioSequence(sequence2);
                            console.log("sequence2.data.length: ", sequence2.data.length);
                            //console.log("length2: ", length2);
                        } else {
                            channels[c].setAudioSequence(sequence);
                            console.log("sequence.data.length: ", sequence.data.length);

                        }

                    }
                    console.log("length: ", length);
                    console.log("oldAudioSequence.data.length: ", oldAudioSequence.data.length);

                }
                break;

            default:
                // Do nothing
                break;
        }
        return;
    }
}
/* 
function scaleNotes(notes, timeScaleFactor, pitchScaleFactor, params) {
    // Set default params if not provided
    params = Object.assign({
      maxDiscrepancy: 0.04, // 40 ms 
      minSegmentLen: 0.01,  // 10 ms
      maxSegmentLen: 0.025, // 25 ms  
      crossfadeLen: 0.03    // 30 ms
    }, params);
  
    let inPos = 0;
    let outPos = 0;
    const outputNotes = [];
  
    while (inPos < notes.length) {
      const note = notes[inPos];
      
      // Calculate time discrepancy 
      const discrepancy = outPos - note.startTime * timeScaleFactor;
  
      if (discrepancy > params.maxDiscrepancy) {
        // Find best segment length
        let bestSegmentLen = 0;
        let bestAutocorr = -Infinity;
  
        for (let segmentLen = params.minSegmentLen; segmentLen <= Math.min(params.maxSegmentLen, note.duration); segmentLen += 0.01) {
          let autocorr = 0;
          for (let i = inPos; i < notes.length && notes[i].startTime < note.startTime + segmentLen; i++) {
            const noteA = notes[i];
            const noteB = notes.find(n => 
              n.startTime >= noteA.startTime + segmentLen && 
              n.pitch === noteA.pitch
            );
            if (noteB) {
              autocorr += noteA.vol * noteB.vol;
            }
          }
          if (autocorr > bestAutocorr) {
            bestAutocorr = autocorr;
            bestSegmentLen = segmentLen;
          }
        }
  
        // Splice using crossfade
        const fadeStart = note.startTime;
        const fadeEnd = fadeStart + params.crossfadeLen;
        
        for (let i = inPos; i < notes.length && notes[i].startTime < fadeEnd; i++) {
          const noteA = notes[i];
          const noteB = notes.find(n => 
            n.startTime >= fadeStart + bestSegmentLen &&
            n.pitch === noteA.pitch  
          );
          if (noteB) {
            const fadeAmount = (noteA.startTime - fadeStart) / params.crossfadeLen;
            outputNotes.push({
              ...noteA,
              vol: noteA.vol * (1 - fadeAmount) + noteB.vol * fadeAmount,
              startTime: outPos
            });
          }
        }
  
        outPos += bestSegmentLen;
        inPos = notes.findIndex(n => n.startTime >= note.startTime + bestSegmentLen);
        
      } else {
        // Copy input note directly to output
        outputNotes.push({
          ...note,
          startTime: outPos,
          duration: note.duration / timeScaleFactor,
          pitch: note.pitch * pitchScaleFactor
        });
        outPos += note.duration / timeScaleFactor;
        inPos++;
      }
    }
  
    return outputNotes;
  } */